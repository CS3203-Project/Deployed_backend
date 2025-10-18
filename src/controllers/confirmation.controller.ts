import { Request, Response } from 'express';
import { prisma } from '../utils/database.js';
import { queueService } from '../services/queue.service.js';
    const metaEnv: any = (import.meta as any)?.env ?? (process.env as any);
    const API_BASE_URL = metaEnv.PROD
      ? metaEnv.VITE_API_BASE_URL_PROD
      : metaEnv.VITE_API_BASE_URL;
// Confirmation data now maps to Schedule table fields
// conversationId will be used to find related schedules via conversation user IDs

interface ConversationConfirmation {
  id?: string;
  conversationId: string;
  customerConfirmation: boolean;
  providerConfirmation: boolean;
  startDate: string | null;
  endDate: string | null;
  serviceFee?: number | null;
  currency?: string;
  updatedAt?: string;
}

// Helper function to find or create a schedule for a conversation
async function findOrCreateScheduleForConversation(conversationId: string): Promise<any> {
  // Get conversation with user IDs
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { userIds: true }
  });

  if (!conversation || conversation.userIds.length < 2) {
    throw new Error('Invalid conversation or insufficient participants');
  }

  // First determine who is the provider and who is the customer
  const users = await prisma.user.findMany({
    where: { id: { in: conversation.userIds } },
    include: { serviceProvider: true }
  });

  // Try to determine provider and customer based on service provider status
  let providerUser = users.find(user => user.serviceProvider);
  let customerUser = users.find(user => !user.serviceProvider);

  // Handle case where both users are service providers
  if (!customerUser && users.length === 2 && users.every(user => user.serviceProvider)) {
    // In provider-to-provider conversations, we'll treat the first user as the "service provider"
    // and the second as the "customer" for the purpose of creating a schedule
    // This allows for scenarios like: provider A hiring provider B, or collaboration
    providerUser = users[0];
    customerUser = users[1];
  }

  // Handle case where both users are regular users (no service providers)
  if (!providerUser && users.length === 2 && users.every(user => !user.serviceProvider)) {
    throw new Error('Cannot create service confirmation between two regular users - at least one must be a service provider');
  }

  if (!providerUser || !customerUser) {
    throw new Error('Unable to determine provider and customer in conversation');
  }

  // Try to find existing schedule for this conversation using proper IDs
  // For provider-to-provider conversations, we need to be more flexible in finding existing schedules
  // since either provider could be providing service to the other
  let schedule = await prisma.schedule.findFirst({
    where: {
      OR: [
        // Standard case: customerUser as customer, providerUser as provider
        {
          userId: customerUser.id,
          providerId: providerUser.serviceProvider!.id
        },
        // Reverse case: in case there's already a schedule with roles reversed
        ...(customerUser.serviceProvider ? [{
          userId: providerUser.id,
          providerId: customerUser.serviceProvider.id
        }] : [])
      ]
    },
    include: {
      user: true,
      provider: { include: { user: true } },
      service: true
    }
  });

  // If no schedule exists, create one
  if (!schedule) {
    // Get or create a default service for this provider
    let service = await prisma.service.findFirst({
      where: { providerId: providerUser.serviceProvider!.id },
      orderBy: { createdAt: 'desc' }
    });

    if (!service) {
      // Create a default category if it doesn't exist
      let defaultCategory = await prisma.category.findUnique({
        where: { slug: 'default' }
      });

      if (!defaultCategory) {
        defaultCategory = await prisma.category.create({
          data: {
            id: 'default',
            name: 'General Services',
            slug: 'default',
            description: 'General consultation and services'
          }
        });
      }

      // Create a default consultation service if none exists
      service = await prisma.service.create({
        data: {
          providerId: providerUser.serviceProvider!.id,
          categoryId: defaultCategory.id,
          title: 'General Consultation',
          description: 'General consultation service',
          price: 0,
          currency: 'USD',
          tags: ['consultation'],
          images: []
        }
      });
    }

    // Create new schedule
    schedule = await prisma.schedule.create({
      data: {
        serviceId: service.id,
        providerId: providerUser.serviceProvider!.id,
        userId: customerUser.id,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour default
        customerConfirmation: false,
        providerConfirmation: false
      },
      include: {
        user: true,
        provider: { include: { user: true } },
        service: true
      }
    });
  }

  return schedule;
}

// Helper function to convert schedule to confirmation format
function scheduleToConfirmation(schedule: any, conversationId: string): ConversationConfirmation {
  return {
    id: schedule.id,
    conversationId,
    customerConfirmation: schedule.customerConfirmation,
    providerConfirmation: schedule.providerConfirmation,
    startDate: schedule.startTime,
    endDate: schedule.endTime,
    serviceFee: schedule.serviceFee ? parseFloat(schedule.serviceFee.toString()) : null,
    currency: schedule.currency,
    updatedAt: schedule.updatedAt || new Date().toISOString()
  };
}

// Remove the in-memory store as we're now using the database
// const confirmationStore = new Map<string, ConversationConfirmation>();

// Helper function to send email notifications
async function sendConfirmationEmails(schedule: any, conversationId: string, eventType: 'BOOKING_CONFIRMATION' | 'BOOKING_CANCELLATION_MODIFICATION') {
  try {
    const emailData = {
      conversationId,
      scheduleId: schedule.id,
      customerEmail: schedule.user.email,
      providerEmail: schedule.provider.user.email,
      customerName: schedule.user.fullName || schedule.user.email,
      providerName: schedule.provider.user.fullName || schedule.provider.user.email,
      serviceName: schedule.service.title,
      startDate: schedule.startTime,
      endDate: schedule.endTime,
      serviceFee: schedule.serviceFee ? parseFloat(schedule.serviceFee.toString()) : undefined,
      currency: schedule.currency || 'USD'
    };

    if (eventType === 'BOOKING_CONFIRMATION') {
      await queueService.sendBookingConfirmation(emailData);
      console.log('📧 Booking confirmation emails queued successfully');
    } else {
      await queueService.sendBookingModification({
        ...emailData,
        message: 'Booking details have been updated'
      });
      console.log('📧 Booking modification emails queued successfully');
    }
  } catch (emailError) {
    console.error(`❌ Failed to queue ${eventType} emails:`, emailError);
    
    // Enhanced error logging for better debugging
    if (emailError.message?.includes('daily limit') || emailError.message?.includes('sending limit')) {
      console.error('🚫 Email service has hit daily sending limits');
      console.error('💡 Recommendation: Upgrade to a professional email service (SendGrid, AWS SES, Mailgun)');
      console.error('📝 Booking was still processed successfully - only email notifications failed');
    } else if (emailError.message?.includes('authentication')) {
      console.error('🔐 Email service authentication failed');
      console.error('💡 Check email credentials and app password configuration');
    } else {
      console.error('❓ Unknown email service error - please check email service health');
    }
    
    // Don't fail the main operation - booking confirmations should work even if emails fail
    console.log('✅ Booking operation completed successfully despite email notification failure');
  }
}

export const getConfirmationController = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    
    // Check if conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    // Find or create schedule for this conversation
    const schedule = await findOrCreateScheduleForConversation(conversationId);
    
    // Convert schedule to confirmation format
    const confirmation = scheduleToConfirmation(schedule, conversationId);
    
    res.json(confirmation);
  } catch (error) {
    console.error('Error getting confirmation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createConfirmationController = async (req: Request, res: Response) => {
  try {
    const { conversationId, customerConfirmation = false, providerConfirmation = false, startDate = null, endDate = null, serviceFee = null, currency = 'USD' } = req.body;
    
    if (!conversationId) {
      return res.status(400).json({ error: 'conversationId is required' });
    }
    
    // Check if conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    // Find or create schedule for this conversation
    let schedule = await findOrCreateScheduleForConversation(conversationId);
    
    // Update the schedule with provided values
    schedule = await prisma.schedule.update({
      where: { id: schedule.id },
      data: {
        customerConfirmation,
        providerConfirmation,
        startTime: startDate || schedule.startTime,
        endTime: endDate || schedule.endTime,
        ...(serviceFee !== null && { serviceFee: serviceFee }),
        ...(currency && { currency })
      },
      include: {
        user: true,
        provider: { include: { user: true } },
        service: true
      }
    });
    
    // Convert to confirmation format
    const confirmation = scheduleToConfirmation(schedule, conversationId);

    // Notify communication service for real-time update
    try {
      await fetch(`${API_BASE_URL}/confirmations/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, confirmation })
      });
    } catch (notifyErr) {
      console.error('Failed to notify communication service:', notifyErr);
    }

    // Send email notification
    await sendConfirmationEmails(schedule, conversationId, 'BOOKING_CONFIRMATION');
    
    res.status(201).json(confirmation);
  } catch (error) {
    console.error('Error creating confirmation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const upsertConfirmationController = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const updates = req.body;
    
    // Check if conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    // Find or create schedule for this conversation
    let schedule = await findOrCreateScheduleForConversation(conversationId);
    
    // Prepare update data, only including defined values
    const updateData: any = {};
    
    if (updates.customerConfirmation !== undefined) {
      updateData.customerConfirmation = updates.customerConfirmation;
    }
    if (updates.providerConfirmation !== undefined) {
      updateData.providerConfirmation = updates.providerConfirmation;
    }
    if (updates.startDate !== undefined) {
      updateData.startTime = updates.startDate;
    }
    if (updates.endDate !== undefined) {
      updateData.endTime = updates.endDate;
    }
    if (updates.serviceFee !== undefined) {
      updateData.serviceFee = updates.serviceFee;
    }
    if (updates.currency !== undefined) {
      updateData.currency = updates.currency;
    }
    
    // Update the schedule
    schedule = await prisma.schedule.update({
      where: { id: schedule.id },
      data: updateData,
      include: {
        user: true,
        provider: { include: { user: true } },
        service: true
      }
    });
    
    // Convert to confirmation format
    const confirmation = scheduleToConfirmation(schedule, conversationId);
    // Safely access environment variables: prefer import.meta.env (Vite) but fall back to process.env (Node).


    // Notify communication service for real-time update
    try {
      await fetch(`${API_BASE_URL}/confirmations/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, confirmation })
      });
    } catch (notifyErr) {
      console.error('Failed to notify communication service:', notifyErr);
    }

    // Send email notification
    await sendConfirmationEmails(schedule, conversationId, 'BOOKING_CANCELLATION_MODIFICATION');
    
    res.json(confirmation);
  } catch (error) {
    console.error('Error updating confirmation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

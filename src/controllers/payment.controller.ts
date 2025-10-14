import { Request, Response } from 'express';
import stripeService from '../services/stripe.service.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PaymentController {
  /**
   * Create payment intent
   */
  async createPaymentIntent(req: Request, res: Response) {
    try {
      const { serviceId, amount, currency = 'lkr' } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      if (!serviceId || !amount) {
        return res.status(400).json({
          success: false,
          message: 'Service ID and amount are required',
        });
      }

      // Verify service exists and get provider ID
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
        include: { provider: true },
      });

      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service not found',
        });
      }

      if (!service.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Service is not active',
        });
      }

      // Create payment intent
      const paymentData = await stripeService.createPaymentIntent(
        serviceId,
        service.providerId,
        userId,
        amount,
        currency
      );

      res.status(200).json({
        success: true,
        message: 'Payment intent created successfully',
        data: paymentData,
      });
    } catch (error) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create payment intent',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Confirm payment
   */
  async confirmPayment(req: Request, res: Response) {
    try {
      const { paymentIntentId } = req.body;

      if (!paymentIntentId) {
        return res.status(400).json({
          success: false,
          message: 'Payment intent ID is required',
        });
      }

      const payment = await stripeService.confirmPayment(paymentIntentId);

      res.status(200).json({
        success: true,
        message: 'Payment confirmed successfully',
        data: payment,
      });
    } catch (error) {
      console.error('Error confirming payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to confirm payment',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(req: Request, res: Response) {
    try {
      const { paymentId } = req.params;

      if (!paymentId) {
        return res.status(400).json({
          success: false,
          message: 'Payment ID is required',
        });
      }

      const payment = await stripeService.getPaymentStatus(paymentId);

      res.status(200).json({
        success: true,
        message: 'Payment status retrieved successfully',
        data: payment,
      });
    } catch (error) {
      console.error('Error getting payment status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get payment status',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get user's payment history
   */
  async getPaymentHistory(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { page = 1, limit = 10 } = req.query;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const skip = (Number(page) - 1) * Number(limit);

      // Check if user is a service provider
      const serviceProvider = await prisma.serviceProvider.findUnique({
        where: { userId },
      });

      // Build where clause based on user type
      const whereClause = serviceProvider 
        ? {
            // For providers: show payments for their services
            provider: {
              userId: userId,
            },
          }
        : {
            // For customers: show their payments
            userId,
          };

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where: whereClause,
          include: {
            service: {
              select: {
                id: true,
                title: true,
                price: true,
              },
            },
            provider: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit),
        }),
        prisma.payment.count({
          where: whereClause,
        }),
      ]);

      res.status(200).json({
        success: true,
        message: 'Payment history retrieved successfully',
        data: {
          payments,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      console.error('Error getting payment history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get payment history',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Refund payment (admin/provider only)
   */
  async refundPayment(req: Request, res: Response) {
    try {
      const { paymentId } = req.params;
      const { amount, reason } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      if (!paymentId) {
        return res.status(400).json({
          success: false,
          message: 'Payment ID is required',
        });
      }

      // Check if user has permission to refund (provider or admin)
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { provider: true },
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found',
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      const isProvider = payment.provider.userId === userId;
      const isAdmin = user?.role === 'ADMIN';

      if (!isProvider && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to refund this payment',
        });
      }

      const refundData = await stripeService.refundPayment(paymentId, amount);

      res.status(200).json({
        success: true,
        message: 'Payment refunded successfully',
        data: refundData,
      });
    } catch (error) {
      console.error('Error refunding payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to refund payment',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get provider earnings
   */
  async getProviderEarnings(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      // Get provider ID from user ID
      const serviceProvider = await prisma.serviceProvider.findUnique({
        where: { userId },
      });

      if (!serviceProvider) {
        return res.status(404).json({
          success: false,
          message: 'Service provider not found',
        });
      }

      const earnings = await stripeService.getProviderEarnings(serviceProvider.id);

      res.status(200).json({
        success: true,
        message: 'Provider earnings retrieved successfully',
        data: earnings,
      });
    } catch (error) {
      console.error('Error getting provider earnings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get provider earnings',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle Stripe webhooks
   */
  async handleWebhook(req: Request, res: Response) {
    try {
      const signature = req.headers['stripe-signature'] as string;
      const payload = req.body;

      if (!signature) {
        return res.status(400).json({
          success: false,
          message: 'Missing stripe signature',
        });
      }

      const event = stripeService.constructWebhookEvent(payload, signature);

      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        case 'payment_intent.canceled':
          await this.handlePaymentCanceled(event.data.object);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Error handling webhook:', error);
      res.status(400).json({
        success: false,
        message: 'Webhook handling failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle payment succeeded webhook
   */
  private async handlePaymentSucceeded(paymentIntent: any) {
    try {
      await stripeService.confirmPayment(paymentIntent.id);
      console.log(`Payment succeeded: ${paymentIntent.id}`);
    } catch (error) {
      console.error('Error handling payment succeeded:', error);
    }
  }

  /**
   * Handle payment failed webhook
   */
  private async handlePaymentFailed(paymentIntent: any) {
    try {
      await stripeService.confirmPayment(paymentIntent.id);
      console.log(`Payment failed: ${paymentIntent.id}`);
    } catch (error) {
      console.error('Error handling payment failed:', error);
    }
  }

  /**
   * Handle payment canceled webhook
   */
  private async handlePaymentCanceled(paymentIntent: any) {
    try {
      await stripeService.confirmPayment(paymentIntent.id);
      console.log(`Payment canceled: ${paymentIntent.id}`);
    } catch (error) {
      console.error('Error handling payment canceled:', error);
    }
  }
}

export default new PaymentController();
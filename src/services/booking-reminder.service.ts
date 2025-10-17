import { PrismaClient } from '@prisma/client';
import { queueService } from './queue.service.js';

const prisma = new PrismaClient();

export class BookingReminderService {

  /**
   * Find confirmed bookings starting within the next 24 hours
   */
  async getUpcomingConfirmedBookings(hoursAhead: number = 24): Promise<any[]> {
    const targetTime = new Date();
    targetTime.setHours(targetTime.getHours() + hoursAhead);

    return await prisma.schedule.findMany({
      where: {
        AND: [
          {
            startTime: {
              gte: new Date().toISOString(),
              lte: targetTime.toISOString()
            }
          },
          {
            customerConfirmation: true,
            providerConfirmation: true
          }
        ]
      },
      include: {
        service: {
          select: {
            title: true,
            provider: {
              select: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
  }

  /**
   * Send reminders for upcoming bookings
   */
  async sendRemindersForUpcomingBookings(): Promise<void> {
    try {
      console.log('🔍 Checking for bookings requiring reminders...');

      const upcomingBookings = await this.getUpcomingConfirmedBookings(24);

      if (upcomingBookings.length === 0) {
        console.log('✅ No upcoming bookings found for reminder');
        return;
      }

      console.log(`📧 Found ${upcomingBookings.length} bookings requiring reminders`);

      for (const booking of upcomingBookings) {
        try {
          await this.sendReminderForBooking(booking);
          console.log(`✅ Sent reminder for booking ${booking.id}`);
        } catch (error) {
          console.error(`❌ Failed to send reminder for booking ${booking.id}:`, error);
        }
      }

    } catch (error) {
      console.error('❌ Error in sendRemindersForUpcomingBookings:', error);
    }
  }

  /**
   * Send reminder for a specific booking
   */
  private async sendReminderForBooking(booking: any): Promise<void> {
    const customerName = `${booking.user.firstName || ''} ${booking.user.lastName || ''}`.trim() || booking.user.email;
    const providerName = `${booking.service.provider.user.firstName || ''} ${booking.service.provider.user.lastName || ''}`.trim() || booking.service.provider.user.email;

    await queueService.sendBookingReminder({
      scheduleId: booking.id,
      customerEmail: booking.user.email,
      providerEmail: booking.service.provider.user.email,
      customerName,
      providerName,
      serviceName: booking.service.title,
      startDate: booking.startTime,
      endDate: booking.endTime,
      serviceFee: booking.serviceFee ? parseFloat(booking.serviceFee.toString()) : undefined,
      currency: booking.currency || 'LKR'
    });
  }

  /**
   * Send immediate reminder for a specific booking (for testing)
   */
  async sendImmediateReminder(scheduleId: string): Promise<void> {
    const booking = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        service: {
          select: {
            title: true,
            provider: {
              select: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    await this.sendReminderForBooking(booking);
  }
}

export const bookingReminderService = new BookingReminderService();

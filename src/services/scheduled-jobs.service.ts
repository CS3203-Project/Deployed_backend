import * as cron from 'node-cron';
import { bookingReminderService } from './booking-reminder.service.js';

export class ScheduledJobsService {
  private bookingReminderJob: cron.ScheduledTask | null = null;

  /**
   * Start all scheduled jobs
   */
  startAllJobs(): void {
    this.startBookingReminderJob();
    console.log('🚀 All scheduled jobs started');
  }

  /**
   * Stop all scheduled jobs
   */
  stopAllJobs(): void {
    if (this.bookingReminderJob) {
      this.bookingReminderJob.stop();
      this.bookingReminderJob = null;
    }
    console.log('⏹️ All scheduled jobs stopped');
  }

  /**
   * Start booking reminder job - runs every hour at minute 0
   */
  private startBookingReminderJob(): void {
    // Run every hour at minute 0 (e.g., 9:00, 10:00, 11:00, etc.)
    this.bookingReminderJob = cron.schedule('55 * * * *', async () => {
      try {
        console.log('🔔 Running booking reminder job...');
        await bookingReminderService.sendRemindersForUpcomingBookings();
        console.log('✅ Booking reminder job completed');
      } catch (error) {
        console.error('❌ Error in booking reminder job:', error);
      }
    });

    console.log('🔔 Booking reminder job scheduled (runs every hour)');
  }

  /**
   * Manually trigger booking reminder job (for testing)
   */
  async triggerBookingReminderJob(): Promise<void> {
    console.log('🔧 Manually triggering booking reminder job...');
    await bookingReminderService.sendRemindersForUpcomingBookings();
    console.log('✅ Manual booking reminder job completed');
  }
}

export const scheduledJobsService = new ScheduledJobsService();

import { Request, Response } from 'express';
import { scheduledJobsService } from '../services/scheduled-jobs.service.js';
import { bookingReminderService } from '../services/booking-reminder.service.js';

export class ScheduledJobsController {

  /**
   * GET /api/admin/scheduled-jobs/trigger-reminder
   * Manually trigger booking reminder job
   */
  async triggerBookingReminder(req: Request, res: Response): Promise<Response> {
    try {
      await scheduledJobsService.triggerBookingReminderJob();
      return res.json({
        success: true,
        message: 'Booking reminder job triggered successfully'
      });
    } catch (error) {
      console.error('Error triggering booking reminder job:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to trigger booking reminder job'
      });
    }
  }

  /**
   * POST /api/admin/scheduled-jobs/send-immediate-reminder
   * Send immediate reminder for a specific booking
   */
  async sendImmediateReminder(req: Request, res: Response): Promise<Response> {
    try {
      const { scheduleId } = req.body;

      if (!scheduleId) {
        return res.status(400).json({
          success: false,
          message: 'scheduleId is required'
        });
      }

      await bookingReminderService.sendImmediateReminder(scheduleId);

      return res.json({
        success: true,
        message: `Immediate reminder sent for booking ${scheduleId}`
      });
    } catch (error: any) {
      console.error('Error sending immediate reminder:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to send immediate reminder'
      });
    }
  }
}

export const scheduledJobsController = new ScheduledJobsController();

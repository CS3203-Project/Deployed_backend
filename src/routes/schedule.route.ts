import { Router } from 'express';
import { getCurrentScheduleTimes, createSchedule, updateSchedule } from '../controllers/schedule.controller.js';
import validate from '../middlewares/validation.middleware.js';
import { serviceIdSchema, createScheduleSchema, updateScheduleSchema } from '../validators/schedule.validator.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router: Router = Router();

// Apply authentication middleware to all routes
// router.use(authMiddleware);

/**
 * @route   GET /api/schedules/current/:serviceId
 * @desc    Get current schedule times for a service (confirmed by both user and provider)
 * @access  Public
 */
router.get('/current/:serviceId', validate(serviceIdSchema), getCurrentScheduleTimes);

/**
 * @route   POST /api/schedules
 * @desc    Create a new schedule
 * @access  Private
 */
router.post('/', validate(createScheduleSchema), createSchedule);

/**
 * @route   PUT /api/schedules/:id
 * @desc    Update a schedule
 * @access  Private
 */
router.put('/:id', validate(updateScheduleSchema), updateSchedule);

export default router;

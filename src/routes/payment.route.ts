import { Router } from 'express';
import paymentController from '../controllers/payment.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router: Router = Router();

/**
 * @route POST /api/payments/create-intent
 * @desc Create a payment intent
 * @access Private
 */
router.post(
  '/create-intent',
  authMiddleware,
  paymentController.createPaymentIntent
);

/**
 * @route POST /api/payments/confirm
 * @desc Confirm a payment
 * @access Private
 */
router.post(
  '/confirm',
  authMiddleware,
  paymentController.confirmPayment
);

/**
 * @route GET /api/payments/status/:paymentId
 * @desc Get payment status
 * @access Private
 */
router.get(
  '/status/:paymentId',
  authMiddleware,
  paymentController.getPaymentStatus
);

/**
 * @route GET /api/payments/history
 * @desc Get user payment history
 * @access Private
 */
router.get(
  '/history',
  authMiddleware,
  paymentController.getPaymentHistory
);

/**
 * @route POST /api/payments/refund/:paymentId
 * @desc Refund a payment
 * @access Private (Provider/Admin only)
 */
router.post(
  '/refund/:paymentId',
  authMiddleware,
  paymentController.refundPayment
);

/**
 * @route GET /api/payments/earnings
 * @desc Get provider earnings
 * @access Private (Provider only)
 */
router.get(
  '/earnings',
  authMiddleware,
  paymentController.getProviderEarnings
);

/**
 * @route POST /api/payments/webhook
 * @desc Handle Stripe webhooks
 * @access Public (Stripe webhook)
 */
router.post(
  '/webhook',
  paymentController.handleWebhook
);

export default router;
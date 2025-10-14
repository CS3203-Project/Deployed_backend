import Stripe from 'stripe';
import { PrismaClient, PaymentStatus } from '@prisma/client';
import { config } from 'dotenv';

config();

const prisma = new PrismaClient();

class StripeService {
  private stripe: Stripe;

  constructor() {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
    }
    
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover',
    });
  }

  /**
   * Create a payment intent for a service
   */
  async createPaymentIntent(
    serviceId: string,
    providerId: string,
    userId: string,
    amount: number,
    currency: string = 'lkr'
  ) {
    try {
      // Calculate platform fee (5% platform fee, 95% to provider)
      const platformFeePercentage = 0.05;
      const platformFee = Math.round(amount * platformFeePercentage);
      const providerAmount = amount - platformFee;

      // Create payment intent with Stripe
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata: {
          serviceId,
          providerId,
          userId,
          platformFee: platformFee.toString(),
          providerAmount: providerAmount.toString(),
        },
      });

      // Save payment record to database
      const payment = await prisma.payment.create({
        data: {
          serviceId,
          providerId,
          userId,
          gateway: 'stripe',
          stripePaymentIntentId: paymentIntent.id,
          amount,
          platformFee,
          providerAmount,
          currency: currency.toLowerCase(),
          status: PaymentStatus.PENDING,
          metadata: {
            stripePaymentIntentId: paymentIntent.id,
            clientSecret: paymentIntent.client_secret,
          },
        },
      });

      return {
        paymentId: payment.id,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount,
        platformFee,
        providerAmount,
        currency,
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  /**
   * Confirm payment and update database
   */
  async confirmPayment(paymentIntentId: string) {
    try {
      // Retrieve payment intent from Stripe
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      // Find payment in database
      const payment = await prisma.payment.findUnique({
        where: { stripePaymentIntentId: paymentIntentId },
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      let status: PaymentStatus;
      let paidAt: Date | undefined;

      switch (paymentIntent.status) {
        case 'succeeded':
          status = PaymentStatus.SUCCEEDED;
          paidAt = new Date();
          // Update provider earnings
          await this.updateProviderEarnings(payment.providerId, payment.providerAmount || 0);
          break;
        case 'processing':
          status = PaymentStatus.PROCESSING;
          break;
        case 'canceled':
          status = PaymentStatus.CANCELED;
          break;
        case 'payment_failed':
          status = PaymentStatus.FAILED;
          break;
        default:
          status = PaymentStatus.PENDING;
      }

      // Update payment status
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status,
          paidAt,
          chargeId: paymentIntent.latest_charge as string || undefined,
        },
      });

      return updatedPayment;
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw new Error('Failed to confirm payment');
    }
  }

  /**
   * Update provider earnings
   */
  private async updateProviderEarnings(providerId: string, amount: number) {
    try {
      const existingEarnings = await prisma.providerEarnings.findUnique({
        where: { providerId },
      });

      if (existingEarnings) {
        // Update existing earnings
        await prisma.providerEarnings.update({
          where: { providerId },
          data: {
            totalEarnings: {
              increment: amount,
            },
            availableBalance: {
              increment: amount,
            },
          },
        });
      } else {
        // Create new earnings record
        await prisma.providerEarnings.create({
          data: {
            providerId,
            totalEarnings: amount,
            availableBalance: amount,
            pendingBalance: 0,
            totalWithdrawn: 0,
          },
        });
      }
    } catch (error) {
      console.error('Error updating provider earnings:', error);
      throw new Error('Failed to update provider earnings');
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: string) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          service: true,
          provider: true,
          user: true,
        },
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      return payment;
    } catch (error) {
      console.error('Error getting payment status:', error);
      throw new Error('Failed to get payment status');
    }
  }

  /**
   * Handle refund
   */
  async refundPayment(paymentId: string, amount?: number) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (!payment.stripePaymentIntentId) {
        throw new Error('Stripe payment intent not found');
      }

      // Create refund with Stripe
      const refund = await this.stripe.refunds.create({
        payment_intent: payment.stripePaymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined, // Convert to cents if partial refund
      });

      // Update payment status
      const refundStatus = amount && amount < payment.amount.toNumber() 
        ? PaymentStatus.PARTIALLY_REFUNDED 
        : PaymentStatus.REFUNDED;

      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: refundStatus,
          refundedAt: new Date(),
        },
      });

      // Update provider earnings (subtract refunded amount)
      if (payment.providerAmount) {
        const refundAmount = amount || payment.providerAmount.toNumber();
        await this.updateProviderEarnings(payment.providerId, -refundAmount);
      }

      return {
        payment: updatedPayment,
        refund,
      };
    } catch (error) {
      console.error('Error processing refund:', error);
      throw new Error('Failed to process refund');
    }
  }

  /**
   * Get provider earnings
   */
  async getProviderEarnings(providerId: string) {
    try {
      const earnings = await prisma.providerEarnings.findUnique({
        where: { providerId },
      });

      if (!earnings) {
        // Create earnings record if doesn't exist
        return await prisma.providerEarnings.create({
          data: {
            providerId,
            totalEarnings: 0,
            availableBalance: 0,
            pendingBalance: 0,
            totalWithdrawn: 0,
            currency: 'lkr',
          },
        });
      }

      return earnings;
    } catch (error) {
      console.error('Error getting provider earnings:', error);
      throw new Error('Failed to get provider earnings');
    }
  }

  /**
   * Create connected account for provider (for future payouts)
   */
  async createConnectedAccount(providerId: string, email: string) {
    try {
      const account = await this.stripe.accounts.create({
        type: 'express',
        email,
        metadata: {
          providerId,
        },
      });

      // Update provider earnings with Stripe account ID
      await prisma.providerEarnings.update({
        where: { providerId },
        data: {
          stripeAccountId: account.id,
        },
      });

      return account;
    } catch (error) {
      console.error('Error creating connected account:', error);
      throw new Error('Failed to create connected account');
    }
  }

  /**
   * Construct webhook event
   */
  constructWebhookEvent(payload: string | Buffer, signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not defined');
    }

    return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }
}

export default new StripeService();
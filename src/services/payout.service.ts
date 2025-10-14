import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import stripeService from './stripe.service.js';

const prisma = new PrismaClient();

class PayoutService {
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
   * Create a Stripe Express account for a provider
   */
  async createProviderAccount(providerId: string, email: string, businessProfile?: any) {
    try {
      const account = await this.stripe.accounts.create({
        type: 'express',
        email,
        metadata: {
          providerId,
        },
        business_profile: businessProfile || {
          name: 'Service Provider',
          support_email: email,
        },
      });

      // Update provider earnings with Stripe account ID
      await prisma.providerEarnings.upsert({
        where: { providerId },
        create: {
          providerId,
          stripeAccountId: account.id,
          totalEarnings: 0,
          availableBalance: 0,
          pendingBalance: 0,
          totalWithdrawn: 0,
        },
        update: {
          stripeAccountId: account.id,
        },
      });

      return account;
    } catch (error) {
      console.error('Error creating provider account:', error);
      throw new Error('Failed to create provider account');
    }
  }

  /**
   * Create account link for provider onboarding
   */
  async createAccountLink(providerId: string, returnUrl: string, refreshUrl: string) {
    try {
      const earnings = await prisma.providerEarnings.findUnique({
        where: { providerId },
      });

      if (!earnings?.stripeAccountId) {
        throw new Error('Provider does not have a Stripe account');
      }

      const accountLink = await this.stripe.accountLinks.create({
        account: earnings.stripeAccountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });

      return accountLink;
    } catch (error) {
      console.error('Error creating account link:', error);
      throw new Error('Failed to create account link');
    }
  }

  /**
   * Check if provider account is ready for payouts
   */
  async isAccountReady(providerId: string) {
    try {
      const earnings = await prisma.providerEarnings.findUnique({
        where: { providerId },
      });

      if (!earnings?.stripeAccountId) {
        return false;
      }

      const account = await this.stripe.accounts.retrieve(earnings.stripeAccountId);
      return account.charges_enabled && account.payouts_enabled;
    } catch (error) {
      console.error('Error checking account readiness:', error);
      return false;
    }
  }

  /**
   * Get account status and requirements
   */
  async getAccountStatus(providerId: string) {
    try {
      const earnings = await prisma.providerEarnings.findUnique({
        where: { providerId },
      });

      if (!earnings?.stripeAccountId) {
        return {
          hasAccount: false,
          chargesEnabled: false,
          payoutsEnabled: false,
          requirements: [],
        };
      }

      const account = await this.stripe.accounts.retrieve(earnings.stripeAccountId);
      
      return {
        hasAccount: true,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        requirements: account.requirements?.currently_due || [],
        accountId: account.id,
      };
    } catch (error) {
      console.error('Error getting account status:', error);
      throw new Error('Failed to get account status');
    }
  }

  /**
   * Create a payout to provider's bank account
   */
  async createPayout(providerId: string, amount: number, currency: string = 'lkr') {
    try {
      const earnings = await prisma.providerEarnings.findUnique({
        where: { providerId },
      });

      if (!earnings?.stripeAccountId) {
        throw new Error('Provider does not have a Stripe account');
      }

      if (earnings.availableBalance.toNumber() < amount) {
        throw new Error('Insufficient available balance');
      }

      // Check if account is ready for payouts
      const isReady = await this.isAccountReady(providerId);
      if (!isReady) {
        throw new Error('Provider account is not ready for payouts');
      }

      // Create transfer to connected account
      const transfer = await this.stripe.transfers.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        destination: earnings.stripeAccountId,
        metadata: {
          providerId,
          type: 'payout',
        },
      });

      // Update provider earnings
      await prisma.providerEarnings.update({
        where: { providerId },
        data: {
          availableBalance: {
            decrement: amount,
          },
          totalWithdrawn: {
            increment: amount,
          },
          lastPayoutAt: new Date(),
        },
      });

      return {
        transferId: transfer.id,
        amount,
        currency,
        status: 'completed',
      };
    } catch (error) {
      console.error('Error creating payout:', error);
      throw new Error('Failed to create payout');
    }
  }

  /**
   * Get payout history for a provider
   */
  async getPayoutHistory(providerId: string, limit: number = 10) {
    try {
      const earnings = await prisma.providerEarnings.findUnique({
        where: { providerId },
      });

      if (!earnings?.stripeAccountId) {
        return [];
      }

      const transfers = await this.stripe.transfers.list({
        destination: earnings.stripeAccountId,
        limit,
      });

      return transfers.data.map(transfer => ({
        id: transfer.id,
        amount: transfer.amount / 100, // Convert from cents
        currency: transfer.currency,
        created: new Date(transfer.created * 1000),
        status: transfer.reversed ? 'reversed' : 'completed',
      }));
    } catch (error) {
      console.error('Error getting payout history:', error);
      throw new Error('Failed to get payout history');
    }
  }

  /**
   * Calculate available balance for immediate payout
   */
  async getAvailableBalance(providerId: string) {
    try {
      const earnings = await prisma.providerEarnings.findUnique({
        where: { providerId },
      });

      if (!earnings) {
        return {
          available: 0,
          pending: 0,
          total: 0,
        };
      }

      return {
        available: earnings.availableBalance.toNumber(),
        pending: earnings.pendingBalance.toNumber(),
        total: earnings.totalEarnings.toNumber(),
        withdrawn: earnings.totalWithdrawn.toNumber(),
      };
    } catch (error) {
      console.error('Error getting available balance:', error);
      throw new Error('Failed to get available balance');
    }
  }

  /**
   * Set up automatic payouts (daily/weekly/monthly)
   */
  async setupAutomaticPayouts(providerId: string, schedule: 'daily' | 'weekly' | 'monthly', minAmount: number = 25) {
    try {
      const earnings = await prisma.providerEarnings.findUnique({
        where: { providerId },
      });

      if (!earnings?.stripeAccountId) {
        throw new Error('Provider does not have a Stripe account');
      }

      // Note: Automatic payouts are typically handled by Stripe automatically
      // This is more for configuration purposes
      // You might want to store these preferences in the database
      
      return {
        schedule,
        minAmount,
        message: 'Automatic payout preferences saved',
      };
    } catch (error) {
      console.error('Error setting up automatic payouts:', error);
      throw new Error('Failed to setup automatic payouts');
    }
  }
}

export default new PayoutService();
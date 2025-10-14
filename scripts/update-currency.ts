import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateCurrencyToLKR() {
  try {
    console.log('Starting currency update...');
    
    // Update all ProviderEarnings records to use LKR currency
    const updatedEarnings = await prisma.providerEarnings.updateMany({
      where: {
        currency: 'usd'
      },
      data: {
        currency: 'lkr'
      }
    });
    
    console.log(`Updated ${updatedEarnings.count} ProviderEarnings records to LKR currency`);
    
    // Update all Payment records to use LKR currency
    const updatedPayments = await prisma.payment.updateMany({
      where: {
        currency: 'usd'
      },
      data: {
        currency: 'lkr'
      }
    });
    
    console.log(`Updated ${updatedPayments.count} Payment records to LKR currency`);
    
    // Update all Service records to use LKR currency
    const updatedServices = await prisma.service.updateMany({
      where: {
        currency: 'USD'
      },
      data: {
        currency: 'LKR'
      }
    });
    
    console.log(`Updated ${updatedServices.count} Service records to LKR currency`);
    
    console.log('Currency update completed successfully!');
    
  } catch (error) {
    console.error('Error updating currency:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCurrencyToLKR();
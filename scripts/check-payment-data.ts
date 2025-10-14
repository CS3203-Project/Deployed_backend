import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPaymentData() {
  try {
    console.log('Checking payment data...');
    
    // Get all users and their roles
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });
    
    console.log('\n=== USERS ===');
    users.forEach(user => {
      console.log(`${user.id} | ${user.email} | ${user.firstName} ${user.lastName} | ${user.role}`);
    });
    
    // Get all payments
    const payments = await prisma.payment.findMany({
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
    });
    
    console.log('\n=== PAYMENTS ===');
    console.log(`Total payments: ${payments.length}`);
    
    payments.forEach(payment => {
      console.log(`Payment ID: ${payment.id}`);
      console.log(`  Customer: ${payment.user?.firstName} ${payment.user?.lastName} (${payment.userId})`);
      console.log(`  Provider: ${payment.provider?.user?.firstName} ${payment.provider?.user?.lastName} (${payment.providerId})`);
      console.log(`  Service: ${payment.service?.title}`);
      console.log(`  Amount: ${payment.currency} ${payment.amount}`);
      console.log(`  Status: ${payment.status}`);
      console.log(`  Date: ${payment.createdAt}`);
      console.log('---');
    });
    
    // Check for customers specifically
    const customerUsers = users.filter(u => u.role === 'USER');
    console.log(`\n=== CUSTOMER ANALYSIS ===`);
    console.log(`Total customers: ${customerUsers.length}`);
    
    for (const customer of customerUsers) {
      const customerPayments = payments.filter(p => p.userId === customer.id);
      console.log(`Customer ${customer.firstName} ${customer.lastName} (${customer.email}): ${customerPayments.length} payments`);
    }
    
  } catch (error) {
    console.error('Error checking payment data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPaymentData();
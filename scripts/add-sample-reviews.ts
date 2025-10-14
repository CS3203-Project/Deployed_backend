import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addSampleReviews() {
  try {
    console.log('Starting to add sample reviews...');

    // Get all services
    const services = await prisma.service.findMany({
      take: 10,
      include: {
        provider: true
      }
    });

    if (services.length === 0) {
      console.log('No services found in database');
      return;
    }

    console.log(`Found ${services.length} services`);

    // Get all users to use as reviewers
    const users = await prisma.user.findMany({
      where: {
        role: 'USER'
      },
      take: 5
    });

    if (users.length === 0) {
      console.log('No users found to create reviews');
      return;
    }

    console.log(`Found ${users.length} users to use as reviewers`);

    // Add 2-5 reviews for each service
    for (const service of services) {
      const numReviews = Math.floor(Math.random() * 4) + 2; // 2-5 reviews
      console.log(`\nAdding ${numReviews} reviews for service: ${service.title}`);

      for (let i = 0; i < numReviews; i++) {
        const reviewer = users[Math.floor(Math.random() * users.length)];
        const rating = Math.floor(Math.random() * 3) + 3; // 3-5 stars
        const comments = [
          'Great service! Highly recommended.',
          'Very professional and efficient.',
          'Excellent quality and value for money.',
          'Would definitely use again.',
          'Outstanding service, exceeded expectations!',
          'Good experience overall.',
          'Professional and courteous.',
          'Quick and reliable service.'
        ];
        const comment = comments[Math.floor(Math.random() * comments.length)];

        try {
          // Check if this user already reviewed this service
          const existingReview = await prisma.serviceReview.findFirst({
            where: {
              serviceId: service.id,
              reviewerId: reviewer.id
            }
          });

          if (existingReview) {
            console.log(`  - Review already exists for user ${reviewer.email}`);
            continue;
          }

          const review = await prisma.serviceReview.create({
            data: {
              serviceId: service.id,
              reviewerId: reviewer.id,
              rating,
              comment
            }
          });

          console.log(`  ✓ Added review: ${rating} stars by ${reviewer.email}`);
        } catch (err) {
          console.error(`  ✗ Error adding review:`, err);
        }
      }
    }

    // Get updated service counts
    const servicesWithCounts = await prisma.service.findMany({
      include: {
        _count: {
          select: {
            serviceReviews: true
          }
        }
      },
      take: 10
    });

    console.log('\n=== Summary ===');
    for (const service of servicesWithCounts) {
      console.log(`${service.title}: ${service._count.serviceReviews} reviews`);
    }

    console.log('\n✅ Sample reviews added successfully!');
  } catch (error) {
    console.error('Error adding sample reviews:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addSampleReviews();

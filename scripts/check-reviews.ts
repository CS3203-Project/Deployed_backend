import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkReviews() {
  try {
    console.log('=== Checking Service Reviews ===\n');

    // Count total reviews
    const totalReviews = await prisma.serviceReview.count();
    console.log(`Total service reviews in database: ${totalReviews}\n`);

    if (totalReviews === 0) {
      console.log('⚠️  No reviews found! Services will show 0 rating.');
      console.log('\nTo add sample reviews, run:');
      console.log('  npx tsx scripts/add-sample-reviews.ts\n');
      return;
    }

    // Get services with review counts
    const services = await prisma.service.findMany({
      include: {
        serviceReviews: {
          select: {
            rating: true,
            reviewer: {
              select: {
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            serviceReviews: true
          }
        }
      },
      take: 10
    });

    console.log('Services and their reviews:\n');
    for (const service of services) {
      const reviewCount = service._count.serviceReviews;
      let avgRating = 0;
      
      if (reviewCount > 0) {
        const totalRating = service.serviceReviews.reduce((sum, r) => sum + r.rating, 0);
        avgRating = totalRating / reviewCount;
      }

      console.log(`📦 ${service.title}`);
      console.log(`   ID: ${service.id}`);
      console.log(`   Reviews: ${reviewCount}`);
      console.log(`   Average Rating: ${avgRating.toFixed(1)} ⭐`);
      
      if (reviewCount > 0) {
        console.log(`   Individual ratings:`);
        service.serviceReviews.forEach((review, idx) => {
          console.log(`     ${idx + 1}. ${review.rating} stars - by ${review.reviewer.email}`);
        });
      }
      console.log('');
    }

    console.log('=== Check Complete ===');
  } catch (error) {
    console.error('Error checking reviews:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkReviews();

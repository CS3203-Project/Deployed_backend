/*
  Warnings:

  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Company` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Review` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Schedule` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Service` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ServiceProvider` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ServiceReview` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_parentId_fkey";

-- DropForeignKey
ALTER TABLE "Company" DROP CONSTRAINT "Company_providerId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_providerId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_userId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_revieweeId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_reviewerId_fkey";

-- DropForeignKey
ALTER TABLE "Schedule" DROP CONSTRAINT "Schedule_providerId_fkey";

-- DropForeignKey
ALTER TABLE "Schedule" DROP CONSTRAINT "Schedule_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "Schedule" DROP CONSTRAINT "Schedule_userId_fkey";

-- DropForeignKey
ALTER TABLE "Service" DROP CONSTRAINT "Service_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Service" DROP CONSTRAINT "Service_providerId_fkey";

-- DropForeignKey
ALTER TABLE "ServiceProvider" DROP CONSTRAINT "ServiceProvider_userId_fkey";

-- DropForeignKey
ALTER TABLE "ServiceReview" DROP CONSTRAINT "ServiceReview_reviewerId_fkey";

-- DropForeignKey
ALTER TABLE "ServiceReview" DROP CONSTRAINT "ServiceReview_serviceId_fkey";

-- DropTable
DROP TABLE "Category";

-- DropTable
DROP TABLE "Company";

-- DropTable
DROP TABLE "Payment";

-- DropTable
DROP TABLE "Review";

-- DropTable
DROP TABLE "Schedule";

-- DropTable
DROP TABLE "Service";

-- DropTable
DROP TABLE "ServiceProvider";

-- DropTable
DROP TABLE "ServiceReview";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "user" (
    "id" VARCHAR NOT NULL,
    "email" VARCHAR NOT NULL,
    "Password" VARCHAR NOT NULL,
    "firstName" VARCHAR,
    "lastName" VARCHAR,
    "phone" VARCHAR,
    "ImageUrl" VARCHAR,
    "location" VARCHAR,
    "address" VARCHAR,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "socialmedia" VARCHAR[],

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_provider" (
    "id" VARCHAR NOT NULL,
    "userId" VARCHAR NOT NULL,
    "bio" TEXT,
    "skills" VARCHAR[],
    "qualifications" VARCHAR[],
    "logoUrl" VARCHAR,
    "averageRating" DOUBLE PRECISION,
    "totalReviews" INTEGER,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "service_provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company" (
    "id" VARCHAR NOT NULL,
    "providerId" VARCHAR NOT NULL,
    "Name" VARCHAR,
    "description" VARCHAR,
    "logo" VARCHAR,
    "address" VARCHAR,
    "contact" VARCHAR,
    "socialmedia" VARCHAR[],

    CONSTRAINT "company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category" (
    "id" VARCHAR NOT NULL,
    "name" VARCHAR,
    "slug" VARCHAR,
    "description" TEXT,
    "parentId" VARCHAR,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service" (
    "id" VARCHAR NOT NULL,
    "providerId" VARCHAR NOT NULL,
    "categoryId" VARCHAR NOT NULL,
    "title" VARCHAR,
    "description" TEXT,
    "price" DECIMAL(10,2),
    "currency" VARCHAR DEFAULT 'USD',
    "tags" VARCHAR[],
    "images" VARCHAR[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "workingTime" VARCHAR[],
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule" (
    "id" VARCHAR NOT NULL,
    "serviceId" VARCHAR NOT NULL,
    "providerId" VARCHAR NOT NULL,
    "userId" VARCHAR NOT NULL,
    "startTime" VARCHAR,
    "endTime" VARCHAR,
    "confirm" BOOLEAN NOT NULL DEFAULT false,
    "QueueValue" INTEGER,

    CONSTRAINT "schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" VARCHAR NOT NULL,
    "serviceId" VARCHAR NOT NULL,
    "providerId" VARCHAR NOT NULL,
    "userId" VARCHAR NOT NULL,
    "gateway" VARCHAR,
    "chargeId" VARCHAR,
    "amount" DECIMAL(10,2),
    "currency" VARCHAR,
    "status" VARCHAR,
    "paidAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" VARCHAR NOT NULL,
    "reviewerId" VARCHAR NOT NULL,
    "revieweeId" VARCHAR NOT NULL,
    "rating" INTEGER,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_reviews" (
    "id" VARCHAR NOT NULL,
    "reviewerId" VARCHAR NOT NULL,
    "revieweeId" VARCHAR NOT NULL,
    "rating" INTEGER,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "service_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "service_provider_userId_key" ON "service_provider"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "category_slug_key" ON "category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "payments_chargeId_key" ON "payments"("chargeId");

-- AddForeignKey
ALTER TABLE "service_provider" ADD CONSTRAINT "service_provider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company" ADD CONSTRAINT "company_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "service_provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category" ADD CONSTRAINT "category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service" ADD CONSTRAINT "service_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "service_provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service" ADD CONSTRAINT "service_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule" ADD CONSTRAINT "schedule_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule" ADD CONSTRAINT "schedule_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "service_provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule" ADD CONSTRAINT "schedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "service_provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "service_provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_reviews" ADD CONSTRAINT "service_reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_reviews" ADD CONSTRAINT "service_reviews_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

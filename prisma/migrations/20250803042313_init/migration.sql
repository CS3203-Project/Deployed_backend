-- AlterTable
ALTER TABLE "ServiceProvider" ADD COLUMN     "IDCardUrl" TEXT,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."Schedule" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'RS',
ADD COLUMN     "serviceFee" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "public"."Service" ALTER COLUMN "currency" SET DEFAULT 'RS';

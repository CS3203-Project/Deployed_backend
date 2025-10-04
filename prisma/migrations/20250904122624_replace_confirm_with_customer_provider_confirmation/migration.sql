/*
  Warnings:

  - You are about to drop the column `confirm` on the `Schedule` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Schedule" DROP COLUMN "confirm",
ADD COLUMN     "customerConfirmation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "providerConfirmation" BOOLEAN NOT NULL DEFAULT false;

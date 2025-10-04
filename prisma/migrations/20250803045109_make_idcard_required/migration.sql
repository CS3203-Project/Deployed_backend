/*
  Warnings:

  - Made the column `IDCardUrl` on table `ServiceProvider` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ServiceProvider" ALTER COLUMN "IDCardUrl" SET NOT NULL;

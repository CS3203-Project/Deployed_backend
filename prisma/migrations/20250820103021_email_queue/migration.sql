/*
  Warnings:

  - You are about to drop the `BlockedConversation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ChatSettings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Conversation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ConversationOnProfile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `History` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Message` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MessageHistory` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "EmailType" AS ENUM ('BOOKING_CONFIRMATION', 'BOOKING_REMINDER', 'BOOKING_CANCELLATION_MODIFICATION', 'NEW_MESSAGE_OR_REVIEW', 'OTHER');

-- DropForeignKey
ALTER TABLE "BlockedConversation" DROP CONSTRAINT "BlockedConversation_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "BlockedConversation" DROP CONSTRAINT "BlockedConversation_userId_fkey";

-- DropForeignKey
ALTER TABLE "ChatSettings" DROP CONSTRAINT "ChatSettings_userId_fkey";

-- DropForeignKey
ALTER TABLE "ConversationOnProfile" DROP CONSTRAINT "ConversationOnProfile_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "ConversationOnProfile" DROP CONSTRAINT "ConversationOnProfile_historyId_fkey";

-- DropForeignKey
ALTER TABLE "ConversationOnProfile" DROP CONSTRAINT "ConversationOnProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_fromId_fkey";

-- DropForeignKey
ALTER TABLE "MessageHistory" DROP CONSTRAINT "MessageHistory_historyId_fkey";

-- DropForeignKey
ALTER TABLE "MessageHistory" DROP CONSTRAINT "MessageHistory_messageId_fkey";

-- DropTable
DROP TABLE "BlockedConversation";

-- DropTable
DROP TABLE "ChatSettings";

-- DropTable
DROP TABLE "Conversation";

-- DropTable
DROP TABLE "ConversationOnProfile";

-- DropTable
DROP TABLE "History";

-- DropTable
DROP TABLE "Message";

-- DropTable
DROP TABLE "MessageHistory";

-- CreateTable
CREATE TABLE "email_queue" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "emailType" "EmailType" NOT NULL,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_queue_userId_idx" ON "email_queue"("userId");

-- CreateIndex
CREATE INDEX "email_queue_emailType_idx" ON "email_queue"("emailType");

-- CreateIndex
CREATE INDEX "email_queue_sentAt_idx" ON "email_queue"("sentAt");

-- AddForeignKey
ALTER TABLE "email_queue" ADD CONSTRAINT "email_queue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

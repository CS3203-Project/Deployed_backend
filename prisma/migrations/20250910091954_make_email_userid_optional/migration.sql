-- DropForeignKey
ALTER TABLE "public"."email_queue" DROP CONSTRAINT "email_queue_userId_fkey";

-- AlterTable
ALTER TABLE "public"."email_queue" ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."email_queue" ADD CONSTRAINT "email_queue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

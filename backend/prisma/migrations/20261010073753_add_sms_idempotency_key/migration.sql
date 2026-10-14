/*
  Warnings:

  - A unique constraint covering the columns `[idempotencyKey]` on the table `SmsMessage` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "SmsMessage" ADD COLUMN     "idempotencyKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "SmsMessage_idempotencyKey_key" ON "SmsMessage"("idempotencyKey");

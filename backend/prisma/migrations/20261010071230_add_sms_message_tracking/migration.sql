-- CreateEnum
CREATE TYPE "SmsDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "SmsMessageStatus" AS ENUM ('QUEUED', 'ACCEPTED', 'SENT', 'DELIVERED', 'FAILED', 'RECEIVED');

-- CreateTable
CREATE TABLE "SmsMessage" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerId" TEXT,
    "campaignId" TEXT,
    "campaignRecipientId" TEXT,
    "direction" "SmsDirection" NOT NULL,
    "status" "SmsMessageStatus" NOT NULL DEFAULT 'QUEUED',
    "fromNumber" TEXT NOT NULL,
    "toNumber" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'TELNYX',
    "providerMessageId" TEXT,
    "errorMessage" TEXT,
    "receivedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmsMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SmsMessage_providerMessageId_key" ON "SmsMessage"("providerMessageId");

-- CreateIndex
CREATE INDEX "SmsMessage_organizationId_idx" ON "SmsMessage"("organizationId");

-- CreateIndex
CREATE INDEX "SmsMessage_organizationId_createdAt_idx" ON "SmsMessage"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "SmsMessage_organizationId_customerId_createdAt_idx" ON "SmsMessage"("organizationId", "customerId", "createdAt");

-- CreateIndex
CREATE INDEX "SmsMessage_campaignId_idx" ON "SmsMessage"("campaignId");

-- CreateIndex
CREATE INDEX "SmsMessage_campaignRecipientId_idx" ON "SmsMessage"("campaignRecipientId");

-- CreateIndex
CREATE INDEX "SmsMessage_organizationId_direction_status_idx" ON "SmsMessage"("organizationId", "direction", "status");

-- AddForeignKey
ALTER TABLE "SmsMessage" ADD CONSTRAINT "SmsMessage_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmsMessage" ADD CONSTRAINT "SmsMessage_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmsMessage" ADD CONSTRAINT "SmsMessage_campaignRecipientId_fkey" FOREIGN KEY ("campaignRecipientId") REFERENCES "CampaignRecipient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

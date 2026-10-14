-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('FOLLOW_UP', 'PROMOTION', 'SERVICE_REMINDER', 'REVIEW_REQUEST', 'RE_ENGAGEMENT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "CampaignChannel" AS ENUM ('SMS', 'EMAIL', 'BOTH');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CampaignTriggerType" AS ENUM ('MANUAL', 'AFTER_PURCHASE', 'AFTER_SERVICE', 'DAYS_AFTER_EVENT', 'SERVICE_DUE', 'SCHEDULED');

-- CreateTable
CREATE TABLE "CustomerService" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "lastServiceAt" TIMESTAMP(3),
    "nextServiceAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "CampaignType" NOT NULL DEFAULT 'FOLLOW_UP',
    "channel" "CampaignChannel" NOT NULL DEFAULT 'SMS',
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "triggerType" "CampaignTriggerType" NOT NULL DEFAULT 'MANUAL',
    "delayDays" INTEGER NOT NULL DEFAULT 0,
    "offerText" TEXT,
    "offerExpiresAt" TIMESTAMP(3),
    "serviceName" TEXT,
    "reminderDaysBefore" INTEGER NOT NULL DEFAULT 0,
    "messageTemplate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerService_organizationId_idx" ON "CustomerService"("organizationId");

-- CreateIndex
CREATE INDEX "CustomerService_customerId_idx" ON "CustomerService"("customerId");

-- CreateIndex
CREATE INDEX "CustomerService_organizationId_nextServiceAt_idx" ON "CustomerService"("organizationId", "nextServiceAt");

-- CreateIndex
CREATE INDEX "Campaign_organizationId_idx" ON "Campaign"("organizationId");

-- CreateIndex
CREATE INDEX "Campaign_organizationId_status_idx" ON "Campaign"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Campaign_organizationId_type_idx" ON "Campaign"("organizationId", "type");

-- AddForeignKey
ALTER TABLE "CustomerService" ADD CONSTRAINT "CustomerService_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

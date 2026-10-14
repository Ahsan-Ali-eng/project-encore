-- CreateTable
CREATE TABLE "EmailWebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'RESEND',
    "providerEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processingError" TEXT,
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "EmailWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailWebhookEvent_providerEventId_key" ON "EmailWebhookEvent"("providerEventId");

-- CreateIndex
CREATE INDEX "EmailWebhookEvent_providerMessageId_idx" ON "EmailWebhookEvent"("providerMessageId");

-- CreateIndex
CREATE INDEX "EmailWebhookEvent_eventType_receivedAt_idx" ON "EmailWebhookEvent"("eventType", "receivedAt");

-- CreateIndex
CREATE INDEX "EmailWebhookEvent_processed_receivedAt_idx" ON "EmailWebhookEvent"("processed", "receivedAt");

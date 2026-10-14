-- CreateEnum
CREATE TYPE "CustomerActivityType" AS ENUM ('PURCHASE', 'SERVICE_COMPLETED', 'REVIEW_RECEIVED', 'NOTE', 'OTHER');

-- CreateTable
CREATE TABLE "CustomerActivity" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" "CustomerActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerActivity_organizationId_idx" ON "CustomerActivity"("organizationId");

-- CreateIndex
CREATE INDEX "CustomerActivity_customerId_idx" ON "CustomerActivity"("customerId");

-- CreateIndex
CREATE INDEX "CustomerActivity_organizationId_occurredAt_idx" ON "CustomerActivity"("organizationId", "occurredAt");

-- CreateIndex
CREATE INDEX "CustomerActivity_organizationId_type_idx" ON "CustomerActivity"("organizationId", "type");

-- AddForeignKey
ALTER TABLE "CustomerActivity" ADD CONSTRAINT "CustomerActivity_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

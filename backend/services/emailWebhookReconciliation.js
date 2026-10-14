
import prisma from "../lib/prisma.js";

const supportedEvents = {
  "email.sent": "SENT",
  "email.delivered": "DELIVERED",
  "email.bounced": "BOUNCED",
  "email.failed": "FAILED",
};

const statusPriority = {
  QUEUED: 0,
  ACCEPTED: 1,
  SENT: 2,
  DELIVERED: 3,
  SIMULATED: 4,
  BOUNCED: 5,
  FAILED: 5,
};

function getEventTimestamp(payload) {
  const parsed = payload?.created_at
    ? new Date(payload.created_at)
    : new Date();

  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

async function reconcileOneEvent(eventId) {
  return prisma.$transaction(async (tx) => {
    const event = await tx.emailWebhookEvent.findUnique({
      where: { id: eventId },
    });

    if (!event || event.processed) {
      return "SKIPPED";
    }

    const nextStatus = supportedEvents[event.eventType];

    if (!nextStatus || !event.providerMessageId) {
      return "SKIPPED";
    }

    const email = await tx.emailMessage.findUnique({
      where: { providerMessageId: event.providerMessageId },
    });

    if (!email) {
      // Keep unmatched events pending for a future reconciliation cycle.
      return "PENDING";
    }

    const currentPriority = statusPriority[email.status] ?? 0;
    const nextPriority = statusPriority[nextStatus] ?? 0;

    const shouldUpdate =
      nextStatus === "BOUNCED" || nextStatus === "FAILED"
        ? !["DELIVERED", "BOUNCED", "FAILED", "SIMULATED"].includes(
            email.status
          )
        : nextPriority > currentPriority &&
          !["BOUNCED", "FAILED", "SIMULATED"].includes(email.status);

    if (shouldUpdate) {
      const timestamp = getEventTimestamp(event.payload);
      const updateData = { status: nextStatus };

      if (nextStatus === "SENT") updateData.sentAt = timestamp;
      if (nextStatus === "DELIVERED") updateData.deliveredAt = timestamp;

      if (nextStatus === "BOUNCED" || nextStatus === "FAILED") {
        updateData.errorMessage = `Email provider event: ${event.eventType}`;

        if (nextStatus === "BOUNCED") {
          updateData.bouncedAt = timestamp;
        }
      }

      await tx.emailMessage.update({
        where: { id: email.id },
        data: updateData,
      });
    }

    await tx.emailWebhookEvent.update({
      where: { id: event.id },
      data: {
        processed: true,
        processedAt: new Date(),
        processingError: null,
      },
    });

    return "PROCESSED";
  });
}

export async function reconcilePendingEmailWebhooks() {
  const pendingEvents = await prisma.emailWebhookEvent.findMany({
    where: {
      provider: "RESEND",
      processed: false,
      eventType: { in: Object.keys(supportedEvents) },
      providerMessageId: { not: null },
    },
    select: { id: true },
    orderBy: { receivedAt: "asc" },
    take: 50,
  });

  let processed = 0;
  let pending = 0;
  let failed = 0;

  for (const event of pendingEvents) {
    try {
      const result = await reconcileOneEvent(event.id);

      if (result === "PROCESSED") processed++;
      if (result === "PENDING") pending++;
    } catch (error) {
      failed++;

      console.error(
        "[Email Webhook Reconciliation] Event failed:",
        event.id,
        error?.message || "Unknown error"
      );
    }
  }

  if (pendingEvents.length > 0) {
    console.log(
      `[Email Webhook Reconciliation] Checked ${pendingEvents.length}; processed ${processed}; still pending ${pending}; failed ${failed}.`
    );
  }

  return { checked: pendingEvents.length, processed, pending, failed };
}

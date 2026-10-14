
import express from "express";
import { Resend } from "resend";
import prisma from "../lib/prisma.js";

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");

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

async function processStoredEvent(tx, storedEvent) {
  const nextStatus = supportedEvents[storedEvent.eventType];
  const emailId = storedEvent.providerMessageId;

  if (!nextStatus || !emailId) {
    await tx.emailWebhookEvent.update({
      where: { id: storedEvent.id },
      data: {
        processed: true,
        processedAt: new Date(),
        processingError: !nextStatus
          ? "Event type is not handled by Encore."
          : "Event did not include a provider email ID.",
      },
    });

    return { processed: true, unmatched: false };
  }

  const email = await tx.emailMessage.findUnique({
    where: { providerMessageId: emailId },
  });

  if (!email) {
    // Keep the event pending so a retry or reconciliation can process it.
    await tx.emailWebhookEvent.update({
      where: { id: storedEvent.id },
      data: {
        processed: false,
        processedAt: null,
        processingError:
          "No matching email record yet. Awaiting retry or reconciliation.",
      },
    });

    return { processed: false, unmatched: true };
  }

  const currentPriority = statusPriority[email.status] ?? 0;
  const nextPriority = statusPriority[nextStatus] ?? 0;

  // Do not overwrite terminal statuses or downgrade delivery progress.
  const shouldUpdate =
    nextStatus === "BOUNCED" || nextStatus === "FAILED"
      ? !["DELIVERED", "BOUNCED", "FAILED", "SIMULATED"].includes(
          email.status
        )
      : nextPriority > currentPriority &&
        !["BOUNCED", "FAILED", "SIMULATED"].includes(email.status);

  if (shouldUpdate) {
    const event = storedEvent.payload;
    const parsedTimestamp = event?.created_at
      ? new Date(event.created_at)
      : new Date();

    const timestamp = Number.isNaN(parsedTimestamp.getTime())
      ? new Date()
      : parsedTimestamp;

    const updateData = { status: nextStatus };

    if (nextStatus === "SENT") updateData.sentAt = timestamp;
    if (nextStatus === "DELIVERED") updateData.deliveredAt = timestamp;

    if (nextStatus === "BOUNCED" || nextStatus === "FAILED") {
      updateData.errorMessage = `Email provider event: ${storedEvent.eventType}`;
      if (nextStatus === "BOUNCED") updateData.bouncedAt = timestamp;
    }

    await tx.emailMessage.update({
      where: { id: email.id },
      data: updateData,
    });
  }

  await tx.emailWebhookEvent.update({
    where: { id: storedEvent.id },
    data: {
      processed: true,
      processedAt: new Date(),
      processingError: null,
    },
  });

  return { processed: true, unmatched: false };
}

async function processEventById(eventId, event) {
  return prisma.$transaction(async (tx) => {
    let storedEvent = await tx.emailWebhookEvent.findUnique({
      where: { providerEventId: eventId },
    });

    if (!storedEvent) {
      const emailId =
        typeof event.data?.email_id === "string"
          ? event.data.email_id
          : typeof event.data?.id === "string"
            ? event.data.id
            : null;

      storedEvent = await tx.emailWebhookEvent.create({
        data: {
          provider: "RESEND",
          providerEventId: eventId,
          eventType: event.type,
          providerMessageId: emailId,
          payload: event,
          processed: false,
        },
      });
    } else if (storedEvent.processed) {
      return { processed: true, duplicate: true, unmatched: false };
    }

    return processStoredEvent(tx, storedEvent);
  });
}

router.post(
  "/",
  express.raw({ type: "application/json", limit: "1mb" }),
  async (req, res) => {
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return res.status(503).json({
        error: "Email webhook verification is not configured.",
      });
    }

    if (!Buffer.isBuffer(req.body)) {
      return res.status(400).json({
        error: "Expected a raw JSON request body.",
      });
    }

    const eventId = req.headers["svix-id"];
    const timestamp = req.headers["svix-timestamp"];
    const signature = req.headers["svix-signature"];

    if (
      typeof eventId !== "string" ||
      !eventId.trim() ||
      typeof timestamp !== "string" ||
      typeof signature !== "string"
    ) {
      return res.status(400).json({
        error: "Missing required webhook signature headers.",
      });
    }

    let event;

    try {
      event = resend.webhooks.verify({
        payload: req.body.toString("utf8"),
        headers: {
          id: eventId,
          timestamp,
          signature,
        },
        webhookSecret,
      });
    } catch {
      return res.status(400).json({
        error: "Invalid webhook signature.",
      });
    }

    if (!event || typeof event.type !== "string") {
      return res.status(400).json({
        error: "Invalid webhook event.",
      });
    }

    try {
      const result = await processEventById(eventId, event);

      if (result.unmatched) {
        // Ask Resend to retry; the pending event remains stored.
        return res.status(500).json({
          error: "Email record not available yet. Please retry.",
        });
      }

      return res.status(200).json({
        received: true,
        ...(result.duplicate ? { duplicate: true } : {}),
      });
    } catch (error) {
      // Another concurrent request may have inserted this event ID.
      if (error?.code === "P2002") {
        try {
          const existing = await prisma.emailWebhookEvent.findUnique({
            where: { providerEventId: eventId },
          });

          if (existing?.processed) {
            return res.status(200).json({
              received: true,
              duplicate: true,
            });
          }

          // The stored event remains available for a subsequent retry.
        } catch {
          // Return a retryable response if we cannot confirm persistence.
        }
      }

      console.error(
        "[Resend Webhook] Processing failed:",
        error?.message || "Unknown error"
      );

      return res.status(500).json({
        error: "Webhook processing failed. Please retry.",
      });
    }
  }
);

export default router;


import "dotenv/config";
import { Resend } from "resend";
import prisma from "../lib/prisma.js";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const EMAIL_SIMULATION_MODE =
  process.env.EMAIL_SIMULATION_MODE === "true";

const EMAIL_SEND_ENABLED =
  process.env.EMAIL_SEND_ENABLED === "true";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatEmailResult(message, duplicate = false) {
  return {
    id: message.id,
    providerMessageId: message.providerMessageId,
    status: message.status,
    to: message.toEmail,
    duplicate,
  };
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function getEmailDomain(email) {
  return email.substring(email.lastIndexOf("@") + 1);
}

export async function sendEmail({
  organizationId,
  customerId = null,
  campaignId = null,
  campaignRecipientId = null,
  idempotencyKey,
  fromName,
  fromEmail,
  replyToEmail = null,
  toEmail,
  subject,
  body,
}) {
  // Validate required identifiers.
  if (
    typeof organizationId !== "string" ||
    !organizationId.trim()
  ) {
    throw new Error("Organization ID is required.");
  }

  if (
    typeof idempotencyKey !== "string" ||
    !idempotencyKey.trim()
  ) {
    throw new Error("An idempotency key is required.");
  }

  // Validate input types and required content.
  if (
    typeof fromName !== "string" ||
    !fromName.trim() ||
    typeof fromEmail !== "string" ||
    !fromEmail.trim() ||
    typeof toEmail !== "string" ||
    !toEmail.trim() ||
    typeof subject !== "string" ||
    !subject.trim() ||
    typeof body !== "string" ||
    !body.trim()
  ) {
    throw new Error(
      "Sender name, sender email, recipient, subject, and body are required."
    );
  }

  if (
    replyToEmail !== null &&
    (typeof replyToEmail !== "string" || !replyToEmail.trim())
  ) {
    throw new Error("A valid reply-to email address is required.");
  }

  const normalizedOrganizationId = organizationId.trim();
  const normalizedIdempotencyKey = idempotencyKey.trim();
  const normalizedFromName = fromName.trim();
  const normalizedFromEmail = normalizeEmail(fromEmail);
  const normalizedToEmail = normalizeEmail(toEmail);
  const normalizedReplyToEmail = replyToEmail
    ? normalizeEmail(replyToEmail)
    : null;

  // Validate email address formats.
  if (
    !EMAIL_PATTERN.test(normalizedFromEmail) ||
    !EMAIL_PATTERN.test(normalizedToEmail) ||
    (normalizedReplyToEmail &&
      !EMAIL_PATTERN.test(normalizedReplyToEmail))
  ) {
    throw new Error("A valid email address is required.");
  }

  // Load the sender configuration for this organization only.
  const settings = await prisma.organizationEmailSettings.findUnique({
    where: {
      organizationId: normalizedOrganizationId,
    },
  });

  if (!settings?.senderName || !settings?.senderEmail) {
    throw new Error(
      "Configure your organization's sender settings before sending email."
    );
  }

  const savedSenderEmail = normalizeEmail(settings.senderEmail);
  const savedSenderName = settings.senderName.trim();
  const savedReplyToEmail = settings.replyToEmail
    ? normalizeEmail(settings.replyToEmail)
    : null;

  // The requested sender must match the saved organization settings.
  if (
    normalizedFromEmail !== savedSenderEmail ||
    normalizedFromName !== savedSenderName ||
    normalizedReplyToEmail !== savedReplyToEmail
  ) {
    throw new Error(
      "The sender identity does not match your organization's saved settings."
    );
  }

  // The sender address must match the configured domain.
  const senderDomain = getEmailDomain(savedSenderEmail);
  const configuredDomain = settings.domain?.trim().toLowerCase();

  if (!configuredDomain || senderDomain !== configuredDomain) {
    throw new Error(
      "The sender email domain does not match the configured business domain."
    );
  }

  // Check for an existing request only after organization settings
  // and sender identity have been validated.
  const scopedIdempotencyKey =
    `${normalizedOrganizationId}:${normalizedIdempotencyKey}`;

  const existingMessage = await prisma.emailMessage.findUnique({
    where: {
      idempotencyKey: scopedIdempotencyKey,
    },
  });

  if (existingMessage) {
    return formatEmailResult(existingMessage, true);
  }

  // Build a consistent database record.
  const messageData = {
    organizationId: normalizedOrganizationId,
    customerId,
    campaignId,
    campaignRecipientId,
    fromName: normalizedFromName,
    fromEmail: normalizedFromEmail,
    replyToEmail: normalizedReplyToEmail,
    toEmail: normalizedToEmail,
    subject: subject.trim(),
    body,
    provider: "RESEND",
    idempotencyKey: scopedIdempotencyKey,
  };

  // Simulation mode must never call Resend.
  if (EMAIL_SIMULATION_MODE) {
    try {
      const message = await prisma.emailMessage.create({
        data: {
          ...messageData,
          status: "SIMULATED",
          metadata: {
            simulation: true,
            note: "No email was sent to Resend.",
          },
        },
      });

      console.log(
        `[Email Simulation] No real email sent. Database record: ${message.id}`
      );

      return formatEmailResult(message);
    } catch (error) {
      // Handle concurrent requests that use the same idempotency key.
      if (error.code === "P2002") {
        const existing = await prisma.emailMessage.findUnique({
          where: {
            idempotencyKey: scopedIdempotencyKey,
          },
        });

        if (existing) {
          return formatEmailResult(existing, true);
        }
      }

      throw error;
    }
  }

  // Live sending is blocked unless explicitly enabled.
  if (!EMAIL_SEND_ENABLED) {
    throw new Error(
      "Email sending is disabled. Enable it only after verification and testing."
    );
  }

  if (!resend) {
    throw new Error("Resend API key is not configured.");
  }

  // Require verified domain status before any future live-send implementation.
  if (
    settings.verificationStatus !== "VERIFIED" ||
    !settings.resendDomainId
  ) {
    throw new Error(
      "Verify your organization's sending domain before sending live email."
    );
  }

  // Intentionally no live-send implementation yet.
  // Do not call Resend or enable real email delivery until the remaining
  // authorization, delivery, webhook, and idempotency safeguards are tested.
  throw new Error(
    "Live email delivery is not available yet."
  );
}

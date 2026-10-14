import "dotenv/config";
import Telnyx from "telnyx";
import prisma from "../lib/prisma.js";

function getTelnyxClient() {
  const apiKey = process.env.TELNYX_API_KEY;

  if (!apiKey) {
    throw new Error(
      "TELNYX_API_KEY is missing from the backend .env file."
    );
  }

  return new Telnyx({ apiKey });
}

function formatMessageResult(message, duplicate = false) {
  return {
    id: message.id,
    providerMessageId: message.providerMessageId,
    status: message.status,
    from: message.fromNumber,
    to: message.toNumber,
    duplicate,
  };
}

async function createOrGetMessage(data) {
  try {
    const message = await prisma.smsMessage.create({ data });

    return { message, duplicate: false };
  } catch (error) {
    if (error.code === "P2002" && data.idempotencyKey) {
      const existingMessage = await prisma.smsMessage.findUnique({
        where: {
          idempotencyKey: data.idempotencyKey,
        },
      });

      if (existingMessage) {
        return {
          message: existingMessage,
          duplicate: true,
        };
      }
    }

    throw error;
  }
}

export async function sendSms({
  organizationId,
  customerId = null,
  campaignId = null,
  campaignRecipientId = null,
  idempotencyKey,
  from,
  to,
  text,
}) {
  if (!organizationId) {
    throw new Error("Organization ID is required.");
  }

  if (!from || !to || !text?.trim()) {
    throw new Error(
      "Sender number, recipient number, and message are required."
    );
  }

  if (!idempotencyKey?.trim()) {
    throw new Error(
      "An idempotency key is required for every SMS send."
    );
  }

  const phoneNumberPattern = /^\+[1-9]\d{7,14}$/;

  if (!phoneNumberPattern.test(from)) {
    throw new Error(
      "Sender number must use international format, such as +16045550123."
    );
  }

  if (!phoneNumberPattern.test(to)) {
    throw new Error(
      "Recipient number must use international format, such as +16045550124."
    );
  }

  const scopedIdempotencyKey =
    `${organizationId}:${idempotencyKey.trim()}`;

  const simulationMode =
    process.env.SMS_SIMULATION_MODE === "true";

  const liveSendingEnabled =
    process.env.SMS_SEND_ENABLED === "true";

  if (simulationMode) {
    const result = await createOrGetMessage({
      organizationId,
      customerId,
      campaignId,
      campaignRecipientId,
      direction: "OUTBOUND",
      status: "SIMULATED",
      fromNumber: from,
      toNumber: to,
      body: text.trim(),
      provider: "TELNYX",
      idempotencyKey: scopedIdempotencyKey,
      metadata: {
        mode: "simulation",
        note: "No SMS was sent to Telnyx.",
      },
    });

    console.log(
      "[SMS Simulation] No real SMS sent. Database record:",
      result.message.id
    );

    return formatMessageResult(
      result.message,
      result.duplicate
    );
  }

  if (!liveSendingEnabled) {
    throw new Error(
      "SMS sending is disabled. Enable it only after a sending number is configured and a controlled test is approved."
    );
  }

  const result = await createOrGetMessage({
    organizationId,
    customerId,
    campaignId,
    campaignRecipientId,
    direction: "OUTBOUND",
    status: "QUEUED",
    fromNumber: from,
    toNumber: to,
    body: text.trim(),
    provider: "TELNYX",
    idempotencyKey: scopedIdempotencyKey,
  });

  if (result.duplicate) {
    console.log(
      "[Telnyx SMS] Duplicate send blocked:",
      result.message.id
    );

    return formatMessageResult(result.message, true);
  }

  let response;

  try {
    const client = getTelnyxClient();

    response = await client.messages.send({
      from,
      to,
      text: text.trim(),
    });
  } catch (error) {
    await prisma.smsMessage.update({
      where: { id: result.message.id },
      data: {
        status: "FAILED",
        errorMessage:
          error.message || "Telnyx failed to accept the message.",
      },
    });

    console.error("[Telnyx SMS] Sending failed:", {
      messageId: result.message.id,
      error: error.message,
    });

    throw new Error(
      error.message || "Failed to send SMS through Telnyx."
    );
  }

  const providerMessage = response.data;

  const savedMessage = await prisma.smsMessage.update({
    where: { id: result.message.id },
    data: {
      status: "ACCEPTED",
      providerMessageId: providerMessage.id,
    },
  });

  return formatMessageResult(savedMessage);
}
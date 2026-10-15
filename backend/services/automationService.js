import prisma from "../lib/prisma.js";
import { sendSms } from "./smsService.js";

export async function findEligibleCustomers(organizationId, campaign) {
  const now = new Date();

  const customers = await prisma.customer.findMany({
    where: {
      organizationId,
      status: "active",
    },
    include: {
      activities: {
        orderBy: {
          occurredAt: "desc",
        },
      },
      services: {
        orderBy: {
          nextServiceAt: "asc",
        },
      },
    },
  });

  return customers.filter((customer) => {
    switch (campaign.triggerType) {
      case "MANUAL":
        return false;

      case "AFTER_PURCHASE": {
        const purchase = customer.activities.find(
          (activity) => activity.type === "PURCHASE"
        );

        if (!purchase) return false;

        const eligibleAt = new Date(purchase.occurredAt);

        eligibleAt.setDate(
          eligibleAt.getDate() + (campaign.delayDays || 0)
        );

        return now >= eligibleAt;
      }

      case "AFTER_SERVICE": {
        const serviceCompleted = customer.activities.find(
          (activity) => activity.type === "SERVICE_COMPLETED"
        );

        if (!serviceCompleted) return false;

        const eligibleAt = new Date(serviceCompleted.occurredAt);

        eligibleAt.setDate(
          eligibleAt.getDate() + (campaign.delayDays || 0)
        );

        return now >= eligibleAt;
      }

      case "DAYS_AFTER_EVENT": {
        const latestActivity = customer.activities[0];

        if (!latestActivity) return false;

        const eligibleAt = new Date(latestActivity.occurredAt);

        eligibleAt.setDate(
          eligibleAt.getDate() + (campaign.delayDays || 0)
        );

        return now >= eligibleAt;
      }

      case "SERVICE_DUE": {
        if (!campaign.serviceName) return false;

        const matchingService = customer.services.find(
          (service) =>
            service.serviceName.toLowerCase() ===
            campaign.serviceName.toLowerCase()
        );

        if (!matchingService?.nextServiceAt) return false;

        const reminderDate = new Date(matchingService.nextServiceAt);

        reminderDate.setDate(
          reminderDate.getDate() -
            (campaign.reminderDaysBefore || 0)
        );

        return (
          now >= reminderDate &&
          now <= matchingService.nextServiceAt
        );
      }

      case "SCHEDULED":
        return false;

      default:
        return false;
    }
  });
}

export async function processCampaign(organizationId, campaignId) {
  const startedAt = new Date();

  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      organizationId,
    },
  });

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  const execution = await prisma.automationExecution.create({
    data: {
      organizationId,
      campaignId: campaign.id,
      status: "SUCCESS",
      startedAt,
    },
  });

  try {
    if (campaign.status !== "ACTIVE") {
      await prisma.automationExecution.update({
        where: {
          id: execution.id,
          organizationId,
        },
        data: {
          status: "SKIPPED",
          completedAt: new Date(),
        },
      });

      return {
        campaignId: campaign.id,
        processed: false,
        reason: "Campaign is not active",
        eligibleCustomers: 0,
        recipientsCreated: 0,
        simulatedSmsCount: 0,
        smsSkippedNoPhone: 0,
        smsFailures: 0,
      };
    }

    const eligibleCustomers = await findEligibleCustomers(
      organizationId,
      campaign
    );

    if (eligibleCustomers.length === 0) {
      await prisma.automationExecution.update({
        where: {
          id: execution.id,
          organizationId,
        },
        data: {
          completedAt: new Date(),
          eligibleCustomers: 0,
          recipientsCreated: 0,
        },
      });

      return {
        campaignId: campaign.id,
        processed: true,
        reason: "No eligible customers",
        eligibleCustomers: 0,
        recipientsCreated: 0,
        simulatedSmsCount: 0,
        smsSkippedNoPhone: 0,
        smsFailures: 0,
      };
    }

    const customerIds = eligibleCustomers.map(
      (customer) => customer.id
    );

    const result = await prisma.campaignRecipient.createMany({
      data: eligibleCustomers.map((customer) => ({
        organizationId,
        campaignId: campaign.id,
        customerId: customer.id,
      })),
      skipDuplicates: true,
    });

    let simulatedSmsCount = 0;
    let smsSkippedNoPhone = 0;
    let smsFailures = 0;
    let firstSmsError = null;

    const sendsSms = ["SMS", "BOTH"].includes(campaign.channel);

    if (sendsSms) {
      if (process.env.SMS_SIMULATION_MODE !== "true") {
        throw new Error(
          "Campaign SMS is not yet configured for live sending. " +
          "Keep SMS_SIMULATION_MODE=true until organization-specific " +
          "Telnyx sending numbers are configured."
        );
      }

      const from = process.env.SMS_SIMULATION_FROM;

      if (!from) {
        throw new Error(
          "SMS_SIMULATION_FROM is missing from the backend .env file."
        );
      }

      const recipients = await prisma.campaignRecipient.findMany({
        where: {
          organizationId,
          campaignId: campaign.id,
          customerId: {
            in: customerIds,
          },
        },
        include: {
          customer: true,
        },
      });

      for (const recipient of recipients) {
        if (!recipient.customer?.phone) {
          smsSkippedNoPhone++;

          console.log(
            "[Campaign SMS] Skipping customer without a phone number:",
            recipient.customerId
          );

          continue;
        }

        const fallbackMessage =
          `[SIMULATION ONLY] Campaign: ${campaign.name}`;

        const messageText = (
          campaign.messageTemplate?.trim() || fallbackMessage
        )
          .replace(
            /\{\{\s*firstName\s*\}\}/gi,
            recipient.customer.name?.trim().split(/\s+/)[0] || "there"
          )
          .replace(
            /\{\{\s*customerName\s*\}\}/gi,
            recipient.customer.name || "there"
          );

        try {
          const smsResult = await sendSms({
            organizationId,
            customerId: recipient.customerId,
            campaignId: campaign.id,
            campaignRecipientId: recipient.id,
            idempotencyKey:
              `campaign-recipient:${recipient.id}:initial-sms`,
            from,
            to: recipient.customer.phone,
            text: messageText,
          });

          if (smsResult.duplicate) {
            console.log(
              "[Campaign SMS] Existing simulated message reused:",
              smsResult.id
            );
          } else {
            simulatedSmsCount++;
          }
        } catch (error) {
          smsFailures++;

          if (!firstSmsError) {
            firstSmsError = error.message;
          }

          console.error(
            "[Campaign SMS] Simulation failed for customer:",
            recipient.customerId,
            error.message
          );
        }
      }
    }

    await prisma.automationExecution.update({
      where: {
        id: execution.id,
        organizationId,
      },
      data: {
        status: smsFailures > 0 ? "FAILED" : "SUCCESS",
        eligibleCustomers: eligibleCustomers.length,
        recipientsCreated: result.count,
        completedAt: new Date(),
        errorMessage: firstSmsError,
      },
    });

    return {
      campaignId: campaign.id,
      processed: true,
      reason:
        smsFailures > 0
          ? "Campaign processed with SMS errors"
          : "Campaign processed successfully",
      eligibleCustomers: eligibleCustomers.length,
      recipientsCreated: result.count,
      simulatedSmsCount,
      smsSkippedNoPhone,
      smsFailures,
    };
  } catch (error) {
    await prisma.automationExecution.update({
      where: {
        id: execution.id,
        organizationId,
      },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        errorMessage: error.message || "Unknown automation error",
      },
    });

    throw error;
  }
}
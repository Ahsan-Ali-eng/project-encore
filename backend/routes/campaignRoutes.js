import express from "express";
import { getAuth } from "@clerk/express";

import prisma from "../lib/prisma.js";
import {
  findEligibleCustomers,
  processCampaign,
} from "../services/automationService.js";

const router = express.Router();

// Get all campaigns for the current business
router.get("/", async (req, res) => {
  try {
    const { isAuthenticated, orgId } = getAuth(req);

    if (!isAuthenticated) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "You must be signed in.",
      });
    }

    if (!orgId) {
      return res.status(403).json({
        error: "Organization required",
        message: "You must have an active organization.",
      });
    }

    const campaigns = await prisma.campaign.findMany({
      where: {
        organizationId: orgId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(campaigns);
  } catch (error) {
    console.error("Failed to fetch campaigns:", error);

    res.status(500).json({
      error: "Server error",
      message: "Unable to fetch campaigns.",
    });
  }
});

// Create a campaign for the current business
router.post("/", async (req, res) => {
  try {
    const { isAuthenticated, orgId } = getAuth(req);

    if (!isAuthenticated) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "You must be signed in.",
      });
    }

    if (!orgId) {
      return res.status(403).json({
        error: "Organization required",
        message: "You must have an active organization.",
      });
    }

    const {
      name,
      description,
      type,
      channel,
      triggerType,
      delayDays,
      offerText,
      offerExpiresAt,
      serviceName,
      reminderDaysBefore,
      messageTemplate,
      emailSubject,
      emailBody,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        error: "Validation error",
        message: "Campaign name is required.",
      });
    }


const effectiveChannel = channel ?? "SMS";

if (
  (effectiveChannel === "EMAIL" || effectiveChannel === "BOTH") &&
  (
    typeof emailSubject !== "string" ||
    !emailSubject.trim() ||
    typeof emailBody !== "string" ||
    !emailBody.trim()
  )
) {
  return res.status(400).json({
    error: "Validation error",
    message: "Email subject and email body are required for email campaigns.",
  });
}


    const campaignData = {
      organizationId: orgId,
      name: name.trim(),
      description: description?.trim() || null,
      messageTemplate: messageTemplate?.trim() || null,
      emailSubject: emailSubject?.trim() || null,
      emailBody: emailBody?.trim() || null,

      ...(type && { type }),
      ...(channel && { channel }),
      ...(triggerType && { triggerType }),

      delayDays:
        Number.isInteger(delayDays) && delayDays >= 0
          ? delayDays
          : 0,

      offerText: offerText?.trim() || null,

      offerExpiresAt: offerExpiresAt
        ? new Date(offerExpiresAt)
        : null,

      serviceName: serviceName?.trim() || null,

      reminderDaysBefore:
        Number.isInteger(reminderDaysBefore) &&
        reminderDaysBefore >= 0
          ? reminderDaysBefore
          : 0,
    };

    const campaign = await prisma.campaign.create({
      data: campaignData,
    });

    res.status(201).json(campaign);
  } catch (error) {
    console.error("Failed to create campaign:", error);

    res.status(500).json({
      error: "Server error",
      message: "Unable to create campaign.",
    });
  }
});

// Update a campaign belonging to the current business
router.patch("/:id", async (req, res) => {
  try {
    const { isAuthenticated, orgId } = getAuth(req);

    if (!isAuthenticated) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "You must be signed in.",
      });
    }

    if (!orgId) {
      return res.status(403).json({
        error: "Organization required",
        message: "You must have an active organization.",
      });
    }

    const { id } = req.params;

    const existingCampaign = await prisma.campaign.findFirst({
      where: {
        id,
        organizationId: orgId,
      },
    });

    if (!existingCampaign) {
      return res.status(404).json({
        error: "Not found",
        message: "Campaign not found.",
      });
    }

    const {
      name,
      description,
      type,
      channel,
      triggerType,
      delayDays,
      offerText,
      offerExpiresAt,
      serviceName,
      reminderDaysBefore,
      messageTemplate,
      emailSubject,
      emailBody,
      status,
    } = req.body;

    if (name !== undefined && (typeof name !== "string" || !name.trim())) {
      return res.status(400).json({
        error: "Validation error",
        message: "Campaign name is required.",
      });
    }

    const effectiveChannel = channel ?? existingCampaign.channel;

const effectiveEmailSubject =
  emailSubject === undefined
    ? existingCampaign.emailSubject
    : emailSubject;

const effectiveEmailBody =
  emailBody === undefined
    ? existingCampaign.emailBody
    : emailBody;

if (
  (effectiveChannel === "EMAIL" || effectiveChannel === "BOTH") &&
  (
    typeof effectiveEmailSubject !== "string" ||
    !effectiveEmailSubject.trim() ||
    typeof effectiveEmailBody !== "string" ||
    !effectiveEmailBody.trim()
  )
) {
  return res.status(400).json({
    error: "Validation error",
    message: "Email subject and email body are required for email campaigns.",
  });
}

    const campaign = await prisma.campaign.update({
      where: {
        id,
        organizationId: orgId,
      },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && {
          description: description?.trim() || null,
        }),
        ...(messageTemplate !== undefined && {
          messageTemplate: messageTemplate?.trim() || null,
        }),
        ...(emailSubject !== undefined && {
          emailSubject: emailSubject?.trim() || null,
        }),
        ...(emailBody !== undefined && {
          emailBody: emailBody?.trim() || null,
        }),

        ...(type && { type }),
        ...(channel && { channel }),
        ...(triggerType && { triggerType }),
        ...(status && { status }),

        ...(delayDays !== undefined && {
            delayDays:
              Number.isInteger(delayDays) && delayDays >= 0
                ? delayDays
                : existingCampaign.delayDays,
          }),

        ...(offerText !== undefined && {
          offerText: offerText?.trim() || null,
        }),

        ...(offerExpiresAt !== undefined && {
          offerExpiresAt: offerExpiresAt
            ? new Date(offerExpiresAt)
            : null,
        }),

        ...(serviceName !== undefined && {
          serviceName: serviceName?.trim() || null,
        }),

        ...(reminderDaysBefore !== undefined && {
          reminderDaysBefore:
            Number.isInteger(reminderDaysBefore) && reminderDaysBefore >= 0
              ? reminderDaysBefore
              : existingCampaign.reminderDaysBefore,
        }),
      },
    });

    res.json(campaign);
  } catch (error) {
    console.error("Failed to update campaign:", error);

    res.status(500).json({
      error: "Server error",
      message: "Unable to update campaign.",
    });
  }
});
// Get all recipients for a campaign belonging to the current business
router.get("/:id/recipients", async (req, res) => {
  try {
    const { isAuthenticated, orgId } = getAuth(req);

    if (!isAuthenticated) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "You must be signed in.",
      });
    }

    if (!orgId) {
      return res.status(403).json({
        error: "Organization required",
        message: "You must have an active organization.",
      });
    }

    const { id } = req.params;

    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        organizationId: orgId,
      },
      include: {
        recipients: {
          include: {
            customer: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!campaign) {
      return res.status(404).json({
        error: "Not found",
        message: "Campaign not found.",
      });
    }

    res.json(campaign.recipients);
  } catch (error) {
    console.error("Failed to fetch campaign recipients:", error);

    res.status(500).json({
      error: "Server error",
      message: "Unable to fetch campaign recipients.",
    });
  }
});

router.get("/:id/eligible-customers", async (req, res) => {
  try {
   const { isAuthenticated, orgId } = getAuth(req);

    if (!isAuthenticated) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!orgId) {
      return res.status(403).json({
        message: "Organization required",
      });
    }


    const campaign = await prisma.campaign.findFirst({
      where: {
        id: req.params.id,
        organizationId: orgId,
      },
    });

    if (!campaign) {
      return res.status(404).json({
        message: "Campaign not found",
      });
    }

    const customers = await findEligibleCustomers(orgId, campaign);

    res.json(customers);
  } catch (error) {
    console.error("Failed to find eligible customers:", error);
    res.status(500).json({
      message: "Failed to find eligible customers",
    });
  }
});

router.post("/:id/process", async (req, res) => {
  try {
    const { isAuthenticated, orgId } = getAuth(req);

    if (!isAuthenticated) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!orgId) {
      return res.status(403).json({
        message: "Organization required",
      });
    }

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: req.params.id,
        organizationId: orgId,
      },
    });

    if (!campaign) {
      return res.status(404).json({
        message: "Campaign not found",
      });
    }

    const result = await processCampaign(
      orgId,
      campaign.id
    );

    res.json(result);
  } catch (error) {
    console.error("Campaign processing failed:", error);

    res.status(500).json({
      message: "Failed to process campaign",
    });
  }
});

// Replace the recipients for a campaign
router.put("/:id/recipients", async (req, res) => {
  try {
    const { isAuthenticated, orgId } = getAuth(req);

    if (!isAuthenticated) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "You must be signed in.",
      });
    }

    if (!orgId) {
      return res.status(403).json({
        error: "Organization required",
        message: "You must have an active organization.",
      });
    }

    const { id } = req.params;
    const { customerIds } = req.body;

    if (!Array.isArray(customerIds)) {
      return res.status(400).json({
        error: "Validation error",
        message: "customerIds must be an array.",
      });
    }

    const uniqueCustomerIds = [...new Set(customerIds)];

    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        organizationId: orgId,
      },
    });

    if (!campaign) {
      return res.status(404).json({
        error: "Not found",
        message: "Campaign not found.",
      });
    }

    const customers = await prisma.customer.findMany({
      where: {
        id: {
          in: uniqueCustomerIds,
        },
        organizationId: orgId,
      },
      select: {
        id: true,
      },
    });

    if (customers.length !== uniqueCustomerIds.length) {
      return res.status(400).json({
        error: "Validation error",
        message: "One or more customers do not belong to this organization.",
      });
    }

    await prisma.$transaction([
      prisma.campaignRecipient.deleteMany({
        where: {
          campaignId: id,
          organizationId: orgId,
        },
      }),

      prisma.campaignRecipient.createMany({
        data: uniqueCustomerIds.map((customerId) => ({
          organizationId: orgId,
          campaignId: id,
          customerId,
        })),
      }),
    ]);

    const recipients = await prisma.campaignRecipient.findMany({
      where: {
        campaignId: id,
        organizationId: orgId,
      },
      include: {
        customer: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    res.json(recipients);
  } catch (error) {
    console.error("Failed to update campaign recipients:", error);

    res.status(500).json({
      error: "Server error",
      message: "Unable to update campaign recipients.",
    });
  }
});

// Delete a campaign belonging to the current business
router.delete("/:id", async (req, res) => {
  try {
    const { isAuthenticated, orgId } = getAuth(req);

    if (!isAuthenticated) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "You must be signed in.",
      });
    }

    if (!orgId) {
      return res.status(403).json({
        error: "Organization required",
        message: "You must have an active organization.",
      });
    }

    const { id } = req.params;

    const existingCampaign = await prisma.campaign.findFirst({
      where: {
        id,
        organizationId: orgId,
      },
    });

    if (!existingCampaign) {
      return res.status(404).json({
        error: "Not found",
        message: "Campaign not found.",
      });
    }

    await prisma.campaign.delete({
      where: {
        id,
        organizationId: orgId,
      },
    });

    res.json({
      message: "Campaign deleted successfully.",
    });
  } catch (error) {
    console.error("Failed to delete campaign:", error);

    res.status(500).json({
      error: "Server error",
      message: "Unable to delete campaign.",
    });
  }
});

export default router;
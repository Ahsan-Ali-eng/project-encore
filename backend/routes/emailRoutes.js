
import express from "express";
import { getAuth } from "@clerk/express";
import prisma from "../lib/prisma.js";
import {
  createSendingDomain,
  getSendingDomain,
  verifySendingDomain,
} from "../services/emailDomainService.js";

const router = express.Router();

const allowedVerificationStatuses = [
  "NOT_CONFIGURED",
  "PENDING",
  "VERIFIED",
  "ERROR",
];

// Get email settings for the active organization
router.get("/settings", async (req, res) => {
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
        message: "Select a business organization first.",
      });
    }

    const settings = await prisma.organizationEmailSettings.findUnique({
      where: { organizationId: orgId },
    });

    res.json(
      settings || {
        organizationId: orgId,
        senderName: "",
        senderEmail: "",
        replyToEmail: "",
        domain: "",
        verificationStatus: "NOT_CONFIGURED",
        verificationError: null,
        lastVerifiedAt: null,
      }
    );
  } catch (error) {
    console.error("Failed to fetch email settings:", error);

    res.status(500).json({
      error: "Server error",
      message: "Unable to fetch email settings.",
    });
  }
});

// Save email sender configuration for the active organization
router.put("/settings", async (req, res) => {
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
        message: "Select a business organization first.",
      });
    }

    const {
      senderName,
      senderEmail,
      replyToEmail,
    } = req.body;

    if (
      typeof senderName !== "string" ||
      !senderName.trim() ||
      typeof senderEmail !== "string" ||
      !senderEmail.trim() ||
      typeof replyToEmail !== "string" ||
      !replyToEmail.trim()
    ) {
      return res.status(400).json({
        error: "Validation error",
        message: "Sender name, sender email, and reply-to email are required.",
      });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedSender = senderEmail.trim().toLowerCase();
    const normalizedReplyTo = replyToEmail.trim().toLowerCase();

    if (
      !emailPattern.test(normalizedSender) ||
      !emailPattern.test(normalizedReplyTo)
    ) {
      return res.status(400).json({
        error: "Validation error",
        message: "Enter valid sender and reply-to email addresses.",
      });
    }

    const domain = normalizedSender.split("@")[1];

    // Personal email providers are not permitted as branded senders.
    const personalDomains = new Set([
      "gmail.com",
      "googlemail.com",
      "outlook.com",
      "hotmail.com",
      "live.com",
      "msn.com",
      "yahoo.com",
      "icloud.com",
      "me.com",
      "aol.com",
      "proton.me",
      "protonmail.com",
    ]);

    if (personalDomains.has(domain)) {
      return res.status(400).json({
        error: "Business domain required",
        message: "Use an email address on your business-owned domain.",
      });
    }

    const existing = await prisma.organizationEmailSettings.findUnique({
      where: { organizationId: orgId },
    });

    // Changing sender/domain details invalidates the previous verification.
    const domainChanged =
      existing?.domain !== domain ||
      existing?.senderEmail?.toLowerCase() !== normalizedSender;

    const settings = await prisma.organizationEmailSettings.upsert({
      where: { organizationId: orgId },
      create: {
        organizationId: orgId,
        senderName: senderName.trim(),
        senderEmail: normalizedSender,
        replyToEmail: normalizedReplyTo,
        domain,
        verificationStatus: "NOT_CONFIGURED",
      },
      update: {
        senderName: senderName.trim(),
        senderEmail: normalizedSender,
        replyToEmail: normalizedReplyTo,
        domain,
        ...(domainChanged
          ? {
              resendDomainId: null,
              verificationStatus: "NOT_CONFIGURED",
              verificationError: null,
              lastVerifiedAt: null,
            }
          : {}),
      },
    });

    res.json(settings);
  } catch (error) {
    console.error("Failed to save email settings:", error);

    res.status(500).json({
      error: "Server error",
      message: "Unable to save email settings.",
    });
  }
});


function normalizeDomain(value) {
  return typeof value === "string"
    ? value.trim().toLowerCase()
    : "";
}

// Create a domain for the active organization.
router.post("/domains", async (req, res) => {
  try {
    const { isAuthenticated, orgId } = getAuth(req);

    if (!isAuthenticated) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!orgId) {
      return res.status(403).json({
        error: "Organization required",
      });
    }

    const domain = normalizeDomain(req.body.domain);

    if (!domain || domain.includes("@")) {
      return res.status(400).json({
        error: "Enter a valid business domain.",
      });
    }

    const settings = await prisma.organizationEmailSettings.findUnique({
      where: { organizationId: orgId },
    });

    if (!settings?.senderEmail || settings.domain !== domain) {
      return res.status(400).json({
        error: "Sender setup required",
        message:
          "Save a sender email on this domain before registering it.",
      });
    }

    if (settings.resendDomainId) {
      return res.status(409).json({
        error: "A domain is already registered for this organization.",
      });
    }

    const result = await createSendingDomain(domain);

    if (!result?.id) {
      throw new Error("Resend did not return a domain ID.");
    }

    const updated = await prisma.organizationEmailSettings.update({
      where: { organizationId: orgId },
      data: {
        resendDomainId: result.id,
        verificationStatus: "PENDING",
        verificationError: null,
        lastVerifiedAt: null,
      },
    });

    res.status(201).json({
      settings: updated,
      domain: result,
    });

} catch (error) {
  console.error("Failed to create sending domain:", error);

  return res.status(500).json({
    error: "Domain setup failed",
    message: "Unable to create the sending domain. Please try again or contact support if the problem persists.",
  });
}

});

// Check the domain registered to the active organization.
router.get("/domains/status", async (req, res) => {
  try {
    const { isAuthenticated, orgId } = getAuth(req);

    if (!isAuthenticated) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!orgId) {
      return res.status(403).json({
        error: "Organization required",
      });
    }

    const settings = await prisma.organizationEmailSettings.findUnique({
      where: { organizationId: orgId },
    });

    if (!settings?.resendDomainId) {
      return res.json({
        verificationStatus: "NOT_CONFIGURED",
        domain: settings?.domain || null,
      });
    }

    const domain = await getSendingDomain(settings.resendDomainId);


    const providerStatus =
    typeof domain?.status === "string"
        ? domain.status.toLowerCase()
        : null;

    let verificationStatus = "PENDING";
    let verificationError = null;

    if (providerStatus === "verified") {
    verificationStatus = "VERIFIED";
    } else if (
    providerStatus === "failed" ||
    providerStatus === "temporary_failure"
    ) {
    verificationStatus = "ERROR";
    verificationError = `Resend domain status: ${providerStatus}`;
    } else if (
    providerStatus !== "pending" &&
    providerStatus !== "not_started"
    ) {
    verificationStatus = "ERROR";
    verificationError = providerStatus
        ? `Unrecognized Resend domain status: ${providerStatus}`
        : "Resend did not return a domain status.";
    }


    const updated = await prisma.organizationEmailSettings.update({
      where: { organizationId: orgId },
      data: {
        verificationStatus,
        verificationError,
        lastVerifiedAt:
            verificationStatus === "VERIFIED" ? new Date() : null,
        },
    });

    res.json({
      domain: updated.domain,
      verificationStatus: updated.verificationStatus,
      verificationError: updated.verificationError,
      lastVerifiedAt: updated.lastVerifiedAt,
      providerStatus: providerStatus || "unknown",
      records: domain?.records || [],
    });

    } catch (error) {
    console.error("Failed to check domain status:", error);

    return res.status(502).json({
        error: "Unable to check domain status",
        message: "We couldn't check your domain verification status. Please try again later.",
    });
    }

});

// Ask Resend to recheck DNS for this organization's domain.
router.post("/domains/verify", async (req, res) => {
  try {
    const { isAuthenticated, orgId } = getAuth(req);

    if (!isAuthenticated) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!orgId) {
      return res.status(403).json({
        error: "Organization required",
      });
    }

    const settings = await prisma.organizationEmailSettings.findUnique({
      where: { organizationId: orgId },
    });

    if (!settings?.resendDomainId) {
      return res.status(400).json({
        error: "Register your domain before verifying it.",
      });
    }

    await verifySendingDomain(settings.resendDomainId);

    res.json({
      message: "Verification requested. Check the status again shortly.",
    });

    } catch (error) {
    console.error("Failed to request domain verification:", error);

    return res.status(502).json({
            error: "Verification request failed",
            message: "Unable to request domain verification. Please try again later.",
        });
    }

});


export default router;

import express from "express";
import { getAuth } from "@clerk/express";

import prisma from "../lib/prisma.js";

const router = express.Router();

// Get all activities for a customer
router.get("/customer/:customerId", async (req, res) => {
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

    const { customerId } = req.params;

    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        organizationId: orgId,
      },
    });

    if (!customer) {
      return res.status(404).json({
        error: "Not found",
        message: "Customer not found.",
      });
    }

    const activities = await prisma.customerActivity.findMany({
      where: {
        customerId,
        organizationId: orgId,
      },
      orderBy: {
        occurredAt: "desc",
      },
    });

    res.json(activities);
  } catch (error) {
    console.error("Failed to fetch customer activities:", error);

    res.status(500).json({
      error: "Server error",
      message: "Unable to fetch customer activities.",
    });
  }
});

// Create a customer activity
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
      customerId,
      type,
      title,
      description,
      occurredAt,
      metadata,
    } = req.body;

    if (!customerId) {
      return res.status(400).json({
        error: "Validation error",
        message: "Customer ID is required.",
      });
    }

    if (!type) {
      return res.status(400).json({
        error: "Validation error",
        message: "Activity type is required.",
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        error: "Validation error",
        message: "Activity title is required.",
      });
    }

    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        organizationId: orgId,
      },
    });

    if (!customer) {
      return res.status(404).json({
        error: "Not found",
        message: "Customer not found.",
      });
    }

    const activity = await prisma.customerActivity.create({
      data: {
        organizationId: orgId,
        customerId,
        type,
        title: title.trim(),
        description: description?.trim() || null,
        occurredAt: occurredAt
          ? new Date(occurredAt)
          : new Date(),
        metadata: metadata ?? null,
      },
    });

    res.status(201).json(activity);
  } catch (error) {
    console.error("Failed to create customer activity:", error);

    res.status(500).json({
      error: "Server error",
      message: "Unable to create customer activity.",
    });
  }
});

// Update a customer activity
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

    const existingActivity = await prisma.customerActivity.findFirst({
      where: {
        id,
        organizationId: orgId,
      },
    });

    if (!existingActivity) {
      return res.status(404).json({
        error: "Not found",
        message: "Activity not found.",
      });
    }

    const {
      type,
      title,
      description,
      occurredAt,
      metadata,
    } = req.body;

    if (!type) {
      return res.status(400).json({
        error: "Validation error",
        message: "Activity type is required.",
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        error: "Validation error",
        message: "Activity title is required.",
      });
    }

    const activity = await prisma.customerActivity.update({
      where: {
        id,
      },
      data: {
        type,
        title: title.trim(),
        description: description?.trim() || null,
        occurredAt: occurredAt
          ? new Date(occurredAt)
          : existingActivity.occurredAt,
        metadata: metadata ?? null,
      },
    });

    res.json(activity);
  } catch (error) {
    console.error("Failed to update customer activity:", error);

    res.status(500).json({
      error: "Server error",
      message: "Unable to update customer activity.",
    });
  }
});

// Delete a customer activity
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

    const existingActivity = await prisma.customerActivity.findFirst({
      where: {
        id,
        organizationId: orgId,
      },
    });

    if (!existingActivity) {
      return res.status(404).json({
        error: "Not found",
        message: "Activity not found.",
      });
    }

    await prisma.customerActivity.delete({
      where: {
        id,
      },
    });

    res.json({
      message: "Activity deleted successfully.",
    });
  } catch (error) {
    console.error("Failed to delete customer activity:", error);

    res.status(500).json({
      error: "Server error",
      message: "Unable to delete customer activity.",
    });
  }
});

export default router;
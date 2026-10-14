import express from "express";
import { getAuth } from "@clerk/express";

import prisma from "../lib/prisma.js";

const router = express.Router();

// Get all services for a customer
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

    const services = await prisma.customerService.findMany({
      where: {
        customerId,
        organizationId: orgId,
      },
      orderBy: {
        nextServiceAt: "asc",
      },
    });

    res.json(services);
  } catch (error) {
    console.error("Failed to fetch customer services:", error);

    res.status(500).json({
      error: "Server error",
      message: "Unable to fetch customer services.",
    });
  }
});

// Create a service for a customer
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
      serviceName,
      lastServiceAt,
      nextServiceAt,
      notes,
    } = req.body;

    if (!customerId) {
      return res.status(400).json({
        error: "Validation error",
        message: "Customer ID is required.",
      });
    }

    if (!serviceName || !serviceName.trim()) {
      return res.status(400).json({
        error: "Validation error",
        message: "Service name is required.",
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

    const service = await prisma.customerService.create({
      data: {
        organizationId: orgId,
        customerId,
        serviceName: serviceName.trim(),
        lastServiceAt: lastServiceAt
          ? new Date(lastServiceAt)
          : null,
        nextServiceAt: nextServiceAt
          ? new Date(nextServiceAt)
          : null,
        notes: notes?.trim() || null,
      },
    });

    res.status(201).json(service);
  } catch (error) {
    console.error("Failed to create customer service:", error);

    res.status(500).json({
      error: "Server error",
      message: "Unable to create customer service.",
    });
  }
});

// Update a customer service
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

    const existingService = await prisma.customerService.findFirst({
      where: {
        id,
        organizationId: orgId,
      },
    });

    if (!existingService) {
      return res.status(404).json({
        error: "Not found",
        message: "Customer service not found.",
      });
    }

    const {
      serviceName,
      lastServiceAt,
      nextServiceAt,
      notes,
    } = req.body;

    if (!serviceName || !serviceName.trim()) {
      return res.status(400).json({
        error: "Validation error",
        message: "Service name is required.",
      });
    }

    const service = await prisma.customerService.update({
      where: {
        id,
      },
      data: {
        serviceName: serviceName.trim(),
        lastServiceAt: lastServiceAt
          ? new Date(lastServiceAt)
          : null,
        nextServiceAt: nextServiceAt
          ? new Date(nextServiceAt)
          : null,
        notes: notes?.trim() || null,
      },
    });

    res.json(service);
  } catch (error) {
    console.error("Failed to update customer service:", error);

    res.status(500).json({
      error: "Server error",
      message: "Unable to update customer service.",
    });
  }
});

// Delete a customer service
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

    const existingService = await prisma.customerService.findFirst({
      where: {
        id,
        organizationId: orgId,
      },
    });

    if (!existingService) {
      return res.status(404).json({
        error: "Not found",
        message: "Customer service not found.",
      });
    }

    await prisma.customerService.delete({
      where: {
        id,
      },
    });

    res.json({
      message: "Customer service deleted successfully.",
    });
  } catch (error) {
    console.error("Failed to delete customer service:", error);

    res.status(500).json({
      error: "Server error",
      message: "Unable to delete customer service.",
    });
  }
});

export default router;
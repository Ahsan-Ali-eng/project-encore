import express from "express";
import { getAuth } from "@clerk/express";

import prisma from "../lib/prisma.js";

const router = express.Router();

// Get all customers for the current business
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

    const customers = await prisma.customer.findMany({
      where: {
        organizationId: orgId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(customers);
  } catch (error) {
    console.error("Failed to fetch customers:", error);

    res.status(500).json({
      error: "Server error",
      message: "Unable to fetch customers.",
    });
  }
});

// Create a customer for the current business
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

    const { name, email, phone } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        error: "Validation error",
        message: "Customer name is required.",
      });
    }

    const customer = await prisma.customer.create({
      data: {
        organizationId: orgId,
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
      },
    });

    res.status(201).json(customer);
  } catch (error) {
    console.error("Failed to create customer:", error);

    res.status(500).json({
      error: "Server error",
      message: "Unable to create customer.",
    });
  }
});

// Update a customer belonging to the current business
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
    const { name, email, phone, status } = req.body;

    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id,
        organizationId: orgId,
      },
    });

    if (!existingCustomer) {
      return res.status(404).json({
        error: "Not found",
        message: "Customer not found.",
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        error: "Validation error",
        message: "Customer name is required.",
      });
    }

    const customer = await prisma.customer.update({
      where: {
        id,
      },
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        status: status || existingCustomer.status,
      },
    });

    res.json(customer);
  } catch (error) {
    console.error("Failed to update customer:", error);

    res.status(500).json({
      error: "Server error",
      message: "Unable to update customer.",
    });
  }
});

// Delete a customer belonging to the current business
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

    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id,
        organizationId: orgId,
      },
    });

    if (!existingCustomer) {
      return res.status(404).json({
        error: "Not found",
        message: "Customer not found.",
      });
    }

    await prisma.customer.delete({
      where: {
        id,
      },
    });

    res.json({
      message: "Customer deleted successfully.",
    });
  } catch (error) {
    console.error("Failed to delete customer:", error);

    res.status(500).json({
      error: "Server error",
      message: "Unable to delete customer.",
    });
  }
});

export default router;
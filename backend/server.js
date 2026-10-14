import express from "express";
import cors from "cors";
import "dotenv/config";

import { clerkMiddleware } from "@clerk/express";
import prisma from "./lib/prisma.js";

import customerRoutes from "./routes/customerRoutes.js";
import campaignRoutes from "./routes/campaignRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import { startAutomationScheduler } from "./services/automationScheduler.js";
import emailRoutes from "./routes/emailRoutes.js";
import resendWebhookRoutes from "./routes/resendWebhookRoutes.js";

const app = express();
const PORT = 5000;

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);

app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    res.setHeader("Cache-Control", "no-store");
  }
  next();
});

// Resend requires the original request body for signature verification.
// This route must be registered before express.json().
app.use("/api/webhooks/resend", resendWebhookRoutes);

app.use(express.json());

app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    res.setHeader("Cache-Control", "no-store");
  }

  next();
});

app.use(clerkMiddleware());

app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: "ok",
      message: "Project Encore backend is running",
      database: "connected",
    });
  } catch (error) {
    console.error("Database connection failed:", error);

    res.status(500).json({
      status: "error",
      message: "Backend is running, but database connection failed",
    });
  }
});

app.get("/api/auth-test", (req, res) => {
  res.json({
    message: "Authentication route available",
  });
});

app.use("/api/customers", customerRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/emails", emailRoutes);

startAutomationScheduler();

app.listen(PORT, () => {
  console.log(`Project Encore backend running on http://localhost:${PORT}`);
});
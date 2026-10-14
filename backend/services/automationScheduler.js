
import cron from "node-cron";
import { runAutomationCycle } from "./automationRunner.js";
import { reconcilePendingEmailWebhooks } from "./emailWebhookReconciliation.js";

export function startAutomationScheduler() {
  let isRunning = false;
  let isReconciling = false;

  cron.schedule("* * * * *", async () => {
    if (isRunning) {
      console.log(
        "[Automation Scheduler] Previous cycle is still running. Skipping this cycle."
      );
      return;
    }

    try {
      isRunning = true;

      console.log("[Automation Scheduler] Running automation cycle...");

      await runAutomationCycle();
    } catch (error) {
      console.error(
        "[Automation Scheduler] Automation cycle failed:",
        error
      );
    } finally {
      isRunning = false;
    }
  });

  cron.schedule("* * * * *", async () => {
    if (isReconciling) {
      console.log(
        "[Email Webhook Reconciliation] Previous cycle is still running. Skipping this cycle."
      );
      return;
    }

    try {
      isReconciling = true;
      await reconcilePendingEmailWebhooks();
    } catch (error) {
      console.error(
        "[Email Webhook Reconciliation] Cycle failed:",
        error?.message || error
      );
    } finally {
      isReconciling = false;
    }
  });

  console.log(
    "[Automation Scheduler] Scheduler started. Running every minute."
  );
  console.log(
    "[Email Webhook Reconciliation] Scheduled every minute."
  );
}

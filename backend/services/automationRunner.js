import prisma from "../lib/prisma.js";
import { processCampaign } from "./automationService.js";

const AUTOMATION_COOLDOWN_MS = 5 * 60 * 1000;

export async function runAutomationCycle() {
  try {
    const activeCampaigns = await prisma.campaign.findMany({
      where: {
        status: "ACTIVE",
        triggerType: {
          not: "MANUAL",
        },
      },
    });

    if (activeCampaigns.length === 0) {
      console.log("[Automation Runner] No active campaigns to process.");
      return;
    }

    console.log(
      `[Automation Runner] Processing ${activeCampaigns.length} active campaign(s)...`
    );

    const now = Date.now();

    for (const campaign of activeCampaigns) {
      try {
        const lastExecution =
          await prisma.automationExecution.findFirst({
            where: {
              campaignId: campaign.id,
              organizationId: campaign.organizationId,
            },
            orderBy: {
              startedAt: "desc",
            },
          });

        if (lastExecution) {
          const lastExecutionTime = new Date(
            lastExecution.startedAt
          ).getTime();

          const timeSinceLastExecution =
            now - lastExecutionTime;

          if (timeSinceLastExecution < AUTOMATION_COOLDOWN_MS) {
            console.log(
              `[Automation Runner] Skipping campaign ${campaign.id} — processed recently.`
            );

            continue;
          }
        }

        const result = await processCampaign(
          campaign.organizationId,
          campaign.id
        );

        console.log(
          `[Automation Runner] Campaign ${campaign.id}:`,
          result
        );
      } catch (error) {
        console.error(
          `[Automation Runner] Failed to process campaign ${campaign.id}:`,
          error
        );
      }
    }
  } catch (error) {
    console.error(
      "[Automation Runner] Failed to load active campaigns:",
      error
    );
  }
}
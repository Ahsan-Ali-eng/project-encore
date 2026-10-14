
import "dotenv/config";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  console.warn(
    "[Email Domain] Resend API key is not configured."
  );
}

const resend = apiKey ? new Resend(apiKey) : null;

function getResendClient() {
  if (!resend) {
    throw new Error("Resend API key is not configured.");
  }

  return resend;
}

function normalizeAndValidateDomain(domain) {
  if (typeof domain !== "string") {
    throw new Error(
      "Enter a valid domain, such as abcdental.ca."
    );
  }

  const normalizedDomain = domain.trim().toLowerCase();

  const domainPattern =
    /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

  if (!domainPattern.test(normalizedDomain)) {
    throw new Error(
      "Enter a valid domain, such as abcdental.ca."
    );
  }

  return normalizedDomain;
}

export async function createSendingDomain(domain) {
  // Validate first so invalid input never triggers a Resend API request.
  const normalizedDomain = normalizeAndValidateDomain(domain);

  const client = getResendClient();

  const { data, error } = await client.domains.create({
    name: normalizedDomain,
  });

  if (error) {
    throw new Error(
      error.message || "Unable to create sending domain."
    );
  }

  return data;
}

export async function getSendingDomain(domainId) {
  if (typeof domainId !== "string" || !domainId.trim()) {
    throw new Error("A valid Resend domain ID is required.");
  }

  const client = getResendClient();

  const { data, error } = await client.domains.get(domainId.trim());

  if (error) {
    throw new Error(
      error.message || "Unable to retrieve domain status."
    );
  }

  return data;
}

export async function verifySendingDomain(domainId) {
  if (typeof domainId !== "string" || !domainId.trim()) {
    throw new Error("A valid Resend domain ID is required.");
  }

  const client = getResendClient();

  const { data, error } = await client.domains.verify(domainId.trim());

  if (error) {
    throw new Error(
      error.message || "Unable to request domain verification."
    );
  }

  return data;
}

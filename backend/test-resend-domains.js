
import "dotenv/config";
import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is missing from backend/.env");
}

const resend = new Resend(process.env.RESEND_API_KEY);

try {
  const { data, error } = await resend.domains.list();

  if (error) {
    throw new Error(error.message);
  }

  console.log("Resend API connection successful.");
  console.log("Domains currently registered:", data?.data?.length ?? 0);
} catch (error) {
  console.error("Resend domain test failed:", error.message);
  process.exitCode = 1;
}

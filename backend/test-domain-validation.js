
import { createSendingDomain } from "./services/emailDomainService.js";

const invalidDomains = [
  "appointments@abcdental.ca",
  "my business.ca",
  "not-a-domain",
];

for (const domain of invalidDomains) {
  try {
    await createSendingDomain(domain);
    console.log("UNEXPECTED ACCEPTANCE:", domain);
  } catch (error) {
    console.log("Rejected:", domain, "-", error.message);
  }
}

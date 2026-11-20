// One-off connectivity check for the Resend payout-receipt provider.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../../..");
const env = Object.fromEntries(
  fs.readFileSync(path.join(root, ".env"), "utf8").trim().split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    from: "Glance Pay <onboarding@resend.dev>",
    to: env.PAYOUT_EMAIL_TO,
    subject: "Glance Pay — payout stub connectivity test",
    html: "<h2>Glance Pay</h2><p>This is a test receipt from the mock payout rail. No money moved.</p>",
  }),
});
const body = await res.text();
console.log("status:", res.status);
console.log("response:", body.slice(0, 300));

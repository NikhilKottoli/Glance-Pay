import { test, expect } from "@playwright/test";

// Everything in the app except the wallet signature step (which requires a
// human-controlled browser wallet with Base Sepolia test USDC).

test("app loads with real chain config and seeded merchants", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Glance Pay — Testnet Payment Demo");
  await expect(page.locator("#chain-badge")).toContainText("Base Sepolia");
  await expect(page.locator("#chain-badge")).toContainText("84532");
  expect(await page.locator("#merchant option").count()).toBeGreaterThan(0);
  await expect(page.locator(".checklist div")).toHaveCount(4);
  await expect(page.locator("#faucet-usdc")).toHaveAttribute("href", /faucet\.circle\.com/);
  await expect(page.locator("#faucet-eth")).toHaveAttribute("href", /base\.org/);
});

test("admin onboarding adds a merchant visible to the normal user", async ({ page }) => {
  const name = `Test Chai ${Date.now().toString().slice(-5)}`;
  await page.goto("/");
  await page.locator("#tab-admin").click();
  await page.locator("#m-name").fill(name);
  await page.locator("#m-address").fill("1 Demo Street");
  await page.locator("#m-lat").fill("12.9716");
  await page.locator("#m-lng").fill("77.5946");
  await page.locator("#m-upi").fill("upi://pay?pa=testchai@upi&cu=INR");
  await page.locator("#onboard-form button[type=submit]").click();
  await expect(page.locator("#onboard-status")).toContainText("Onboarded");
  await expect(page.locator("#admin-merchants")).toContainText(name);

  await page.locator("#tab-user").click();
  await expect(page.locator(`#merchant option:text-is("${name} - cafe")`)).toBeDefined();
});

test("user amount preview converts INR to USDC and updates the lens", async ({ page }) => {
  await page.goto("/");
  await page.locator("#amount").fill("12.50");
  await expect(page.locator("#usdc-amount")).toHaveValue(/0\.1506/);
  await expect(page.locator("#l3")).toHaveText("confirm on lens");
  await expect(page.locator("#lens-state")).toHaveText("CONFIRM");
});

test("payment is refused without a connected wallet", async ({ page }) => {
  await page.goto("/");
  await page.locator("#pay").click();
  await expect(page.locator("#status")).toContainText("Connect your wallet first");
});

test("missing wallet produces clear guidance", async ({ page }) => {
  await page.goto("/");
  await page.locator("#connect").click();
  await expect(page.locator("#status")).toContainText("No browser wallet found");
});

test("payment history renders from the backend", async ({ page, request }) => {
  const { payments } = await (await request.get("/api/payments")).json();
  await page.goto("/");
  if (payments.length) {
    await expect(page.locator("#payments")).toContainText(payments[0].merchant);
  } else {
    await expect(page.locator("#payments")).toContainText("No payments yet");
  }
});

test("API: health and chain describe the real onchain setup", async ({ request }) => {
  const health = await (await request.get("/api/health")).json();
  expect(health.ok).toBe(true);
  expect(health.mode).toBe("real-onchain-testnet");
  expect(health.chainId).toBe(84532);

  const chain = await (await request.get("/api/chain")).json();
  expect(chain.usdc).toBe("0x036CbD53842c5426634e7929541eC2318f3dCF7e");
  expect(chain.chainId).toBe(84532);
  expect(chain.rpcUrl).toMatch(/sepolia\.base\.org/);
});

test("API: invalid merchant onboarding is rejected", async ({ request }) => {
  const res = await request.post("/api/merchants", {
    data: { name: "Bad", address: "x", lat: 12, lng: 77, upiUri: "not-a-upi" },
  });
  expect(res.status()).toBe(400);
});

test("API: unverified tx is rejected and does not create a payment", async ({ request }) => {
  const before = (await (await request.get("/api/payments")).json()).payments.length;
  const res = await request.post("/api/pay", {
    data: {
      merchantId: "cafe-x", amount: 12.5, wallet: "0xtest",
      txHash: "0x0000000000000000000000000000000000000000000000000000000000000001",
    },
  });
  expect(res.status()).toBe(400);
  const after = (await (await request.get("/api/payments")).json()).payments.length;
  expect(after).toBe(before);
});

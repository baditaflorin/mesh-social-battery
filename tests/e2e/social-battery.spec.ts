import { expect, test } from "@playwright/test";
import { openTwoPeers } from "@baditaflorin/mesh-common/testing";

test("a social-energy check-in reaches another peer in the room", async ({ browser, baseURL }) => {
  const { a, b, cleanup } = await openTwoPeers(browser, baseURL ?? "", {
    storagePrefix: "mesh-social-battery",
  });
  try {
    await a.getByLabel("Your display name").fill("Ari");
    await b.getByLabel("Your display name").fill("Bea");
    await a.getByRole("button", { name: "Open", exact: true }).click();
    await a.getByPlaceholder("e.g. Up for a walk later").fill("A short walk sounds good.");
    await a.getByRole("button", { name: "Share my check-in" }).click();
    await expect(b.getByText("Ari", { exact: true })).toBeVisible({ timeout: 10_000 });
    await expect(b.getByText("Open", { exact: true })).toBeVisible();
    await expect(b.getByText("A short walk sounds good.", { exact: true })).toBeVisible();
  } finally {
    await cleanup();
  }
});

import { describe, expect, it } from "vitest";
import { createAdminClient, createAnonClient } from "../test-support/supabase-clients";
import {
  cleanupTestData,
  createTestHousehold,
  createTestUser,
  signInAs,
} from "../test-support/household-fixtures";
import { createAccount } from "../accounts/create-account";
import { createRecurringTemplate } from "./create-recurring-template";
import { pauseRecurringTemplate } from "./pause-recurring-template";
import { resumeRecurringTemplate } from "./resume-recurring-template";

describe("pauseRecurringTemplate / resumeRecurringTemplate", () => {
  it("pause sets active to false, resume sets it back to true", async () => {
    const admin = createAdminClient();
    const userA = await createTestUser(admin, "member-a");
    const userB = await createTestUser(admin, "member-b");
    const householdId = await createTestHousehold(admin, "Test Household", [
      { user: userA, displayName: "Alice" },
      { user: userB, displayName: "Bob" },
    ]);

    try {
      const anon = createAnonClient();
      await signInAs(anon, userA);
      const account = await createAccount(anon, { householdId, name: "Corrente" });

      const template = await createRecurringTemplate(anon, {
        householdId,
        type: "income",
        amount: 3000,
        dayOfMonth: 1,
        accountId: account.id,
      });
      expect(template.active).toBe(true);

      const paused = await pauseRecurringTemplate(anon, { templateId: template.id });
      expect(paused.active).toBe(false);

      const resumed = await resumeRecurringTemplate(anon, { templateId: template.id });
      expect(resumed.active).toBe(true);
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });
});

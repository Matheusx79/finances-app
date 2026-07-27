import { describe, expect, it } from "vitest";
import { createAdminClient, createAnonClient } from "../test-support/supabase-clients";
import {
  cleanupTestData,
  createTestHousehold,
  createTestUser,
  signInAs,
} from "../test-support/household-fixtures";
import { createAccount } from "../accounts/create-account";
import { createCategory } from "../categories/create-category";
import { createRecurringTemplate } from "./create-recurring-template";
import { updateRecurringTemplate } from "./update-recurring-template";
import { pauseRecurringTemplate } from "./pause-recurring-template";

describe("updateRecurringTemplate", () => {
  it("updates a template's terms without touching its active flag", async () => {
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
      const category = await createCategory(anon, { householdId, name: "Moradia" });
      const otherAccount = await createAccount(anon, { householdId, name: "Cartão" });

      const template = await createRecurringTemplate(anon, {
        householdId,
        type: "expense",
        amount: 100,
        dayOfMonth: 5,
        accountId: account.id,
        categoryId: category.id,
      });
      await pauseRecurringTemplate(anon, { templateId: template.id });

      const updated = await updateRecurringTemplate(anon, {
        templateId: template.id,
        type: "expense",
        amount: 200,
        dayOfMonth: 15,
        accountId: otherAccount.id,
        categoryId: category.id,
      });

      expect(updated.amount).toBe(200);
      expect(updated.dayOfMonth).toBe(15);
      expect(updated.accountId).toBe(otherAccount.id);
      // A paused template stays paused through an edit.
      expect(updated.active).toBe(false);
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });
});

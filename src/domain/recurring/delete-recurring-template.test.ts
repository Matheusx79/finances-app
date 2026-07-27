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
import { deleteRecurringTemplate } from "./delete-recurring-template";
import { postDueRecurringTransactions } from "./post-due-recurring-transactions";

describe("deleteRecurringTemplate", () => {
  it("deletes the template and does not touch transactions it already posted", async () => {
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
        amount: 500,
        dayOfMonth: 5,
        accountId: account.id,
      });

      const posted = await postDueRecurringTransactions(anon, {
        householdId,
        today: new Date(2026, 6, 5), // 2026-07-05
      });
      expect(posted).toHaveLength(1);

      await deleteRecurringTemplate(anon, { templateId: template.id });

      const { data: survivingTransaction, error } = await anon
        .from("transactions")
        .select("id, recurring_template_id")
        .eq("id", posted[0].id)
        .single();
      expect(error).toBeNull();
      expect(survivingTransaction?.recurring_template_id).toBeNull();

      const { data: templateRow } = await anon
        .from("recurring_templates")
        .select("id")
        .eq("id", template.id)
        .maybeSingle();
      expect(templateRow).toBeNull();
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });
});

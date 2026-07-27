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

describe("createRecurringTemplate", () => {
  it("creates an active template for the signed-in member's household", async () => {
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

      const template = await createRecurringTemplate(anon, {
        householdId,
        type: "expense",
        amount: 150.5,
        dayOfMonth: 10,
        accountId: account.id,
        categoryId: category.id,
      });

      expect(template.householdId).toBe(householdId);
      expect(template.type).toBe("expense");
      expect(template.amount).toBe(150.5);
      expect(template.dayOfMonth).toBe(10);
      expect(template.accountId).toBe(account.id);
      expect(template.categoryId).toBe(category.id);
      expect(template.active).toBe(true);
      expect(template.ownerHouseholdMemberId).toBeNull();
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("rejects a template referencing another household's account (household-scoped isolation)", async () => {
    const admin = createAdminClient();
    const outsider = await createTestUser(admin, "outsider");
    const outsiderPartner = await createTestUser(admin, "outsider-partner");
    const memberA = await createTestUser(admin, "member-a");
    const memberB = await createTestUser(admin, "member-b");
    const otherHouseholdId = await createTestHousehold(admin, "Other Household", [
      { user: memberA, displayName: "Alice" },
      { user: memberB, displayName: "Bob" },
    ]);
    const outsiderHouseholdId = await createTestHousehold(admin, "Outsider Household", [
      { user: outsider, displayName: "Out" },
      { user: outsiderPartner, displayName: "Out2" },
    ]);

    try {
      const anon = createAnonClient();
      await signInAs(anon, memberA);
      const account = await createAccount(anon, { householdId: otherHouseholdId, name: "Corrente" });

      const outsiderAnon = createAnonClient();
      await signInAs(outsiderAnon, outsider);

      await expect(
        createRecurringTemplate(outsiderAnon, {
          householdId: outsiderHouseholdId,
          type: "income",
          amount: 100,
          dayOfMonth: 5,
          accountId: account.id,
        }),
      ).rejects.toThrow();
    } finally {
      await cleanupTestData(admin, {
        householdIds: [otherHouseholdId, outsiderHouseholdId],
        userIds: [outsider.id, outsiderPartner.id, memberA.id, memberB.id],
      });
    }
  });
});

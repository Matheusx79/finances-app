import { describe, expect, it } from "vitest";
import { createAdminClient } from "../test-support/supabase-clients";
import {
  cleanupTestData,
  createTestHousehold,
  createTestUser,
} from "../test-support/household-fixtures";

describe("household member cap", () => {
  it("rejects a third member on a household that already has two", async () => {
    const admin = createAdminClient();
    const memberA = await createTestUser(admin, "member-a");
    const memberB = await createTestUser(admin, "member-b");
    const memberC = await createTestUser(admin, "member-c");
    const householdId = await createTestHousehold(admin, "Cap Test Household", [
      { user: memberA, displayName: "Alice" },
      { user: memberB, displayName: "Bob" },
    ]);

    try {
      const { error } = await admin
        .from("household_members")
        .insert({ household_id: householdId, user_id: memberC.id, display_name: "Carol" });

      expect(error?.message).toMatch(/at most two members/);
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [memberA.id, memberB.id, memberC.id],
      });
    }
  });
});

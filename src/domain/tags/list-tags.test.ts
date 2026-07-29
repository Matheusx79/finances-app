import { describe, expect, it } from "vitest";
import { createAdminClient, createAnonClient } from "../test-support/supabase-clients";
import {
  cleanupTestData,
  createTestHousehold,
  createTestUser,
  signInAs,
} from "../test-support/household-fixtures";
import { createTag } from "./create-tag";
import { listTags } from "./list-tags";

describe("listTags", () => {
  it("lists all tags for the signed-in member's household", async () => {
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

      await createTag(anon, { householdId, name: "Reembolsável" });
      await createTag(anon, { householdId, name: "Viagem" });

      const tags = await listTags(anon, { householdId });

      expect(tags.map((t) => t.name)).toEqual(
        expect.arrayContaining(["Reembolsável", "Viagem"]),
      );
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("never returns another household's tags (household-scoped isolation)", async () => {
    const admin = createAdminClient();
    const userA = await createTestUser(admin, "member-a");
    const userB = await createTestUser(admin, "member-b");
    const outsider = await createTestUser(admin, "outsider");
    const outsiderPartner = await createTestUser(admin, "outsider-partner");
    const householdId = await createTestHousehold(admin, "Test Household", [
      { user: userA, displayName: "Alice" },
      { user: userB, displayName: "Bob" },
    ]);
    const otherHouseholdId = await createTestHousehold(admin, "Other Household", [
      { user: outsider, displayName: "Out" },
      { user: outsiderPartner, displayName: "Out2" },
    ]);

    try {
      const anon = createAnonClient();
      await signInAs(anon, userA);
      await createTag(anon, { householdId, name: "Reembolsável" });

      const outsiderAnon = createAnonClient();
      await signInAs(outsiderAnon, outsider);
      await createTag(outsiderAnon, { householdId: otherHouseholdId, name: "Viagem" });

      const tags = await listTags(anon, { householdId });

      expect(tags.some((t) => t.householdId === otherHouseholdId)).toBe(false);
      expect(tags.some((t) => t.name === "Viagem")).toBe(false);
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId, otherHouseholdId],
        userIds: [userA.id, userB.id, outsider.id, outsiderPartner.id],
      });
    }
  });
});

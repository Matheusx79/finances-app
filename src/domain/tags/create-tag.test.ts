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

describe("createTag", () => {
  it("creates a tag for the signed-in member's household", async () => {
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

      const tag = await createTag(anon, { householdId, name: "Reembolsável" });

      expect(tag.name).toBe("Reembolsável");
      expect(tag.householdId).toBe(householdId);
      expect(tag.id).toBeTruthy();
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("is visible to the other household member (shared household data)", async () => {
    const admin = createAdminClient();
    const userA = await createTestUser(admin, "member-a");
    const userB = await createTestUser(admin, "member-b");
    const householdId = await createTestHousehold(admin, "Test Household", [
      { user: userA, displayName: "Alice" },
      { user: userB, displayName: "Bob" },
    ]);

    try {
      const anonA = createAnonClient();
      await signInAs(anonA, userA);
      const tag = await createTag(anonA, { householdId, name: "Reembolsável" });

      const anonB = createAnonClient();
      await signInAs(anonB, userB);
      const tags = await listTags(anonB, { householdId });

      expect(tags.some((t) => t.id === tag.id)).toBe(true);
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("rejects creating a tag for another household (household-scoped isolation)", async () => {
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
      await signInAs(anon, outsider);

      await expect(
        createTag(anon, { householdId: otherHouseholdId, name: "Viagem" }),
      ).rejects.toThrow();
    } finally {
      await cleanupTestData(admin, {
        householdIds: [otherHouseholdId, outsiderHouseholdId],
        userIds: [outsider.id, outsiderPartner.id, memberA.id, memberB.id],
      });
    }
  });
});

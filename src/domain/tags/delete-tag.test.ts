import { describe, expect, it } from "vitest";
import { createAdminClient, createAnonClient } from "../test-support/supabase-clients";
import {
  cleanupTestData,
  createTestHousehold,
  createTestUser,
  signInAs,
} from "../test-support/household-fixtures";
import { createTag } from "./create-tag";
import { deleteTag } from "./delete-tag";
import { listTags } from "./list-tags";

describe("deleteTag", () => {
  it("deletes a tag belonging to the signed-in member's household", async () => {
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
      await deleteTag(anon, { tagId: tag.id });

      const tags = await listTags(anon, { householdId });
      expect(tags.some((t) => t.id === tag.id)).toBe(false);
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
      await deleteTag(anonB, { tagId: tag.id });

      const tags = await listTags(anonA, { householdId });
      expect(tags.some((t) => t.id === tag.id)).toBe(false);
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("rejects deleting another household's tag (household-scoped isolation)", async () => {
    const admin = createAdminClient();
    const memberA = await createTestUser(admin, "member-a");
    const memberB = await createTestUser(admin, "member-b");
    const outsider = await createTestUser(admin, "outsider");
    const outsiderPartner = await createTestUser(admin, "outsider-partner");
    const householdId = await createTestHousehold(admin, "Test Household", [
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
      const tag = await createTag(anon, { householdId, name: "Reembolsável" });

      const outsiderAnon = createAnonClient();
      await signInAs(outsiderAnon, outsider);

      await expect(deleteTag(outsiderAnon, { tagId: tag.id })).rejects.toThrow();

      const tags = await listTags(anon, { householdId });
      expect(tags.some((t) => t.id === tag.id)).toBe(true);
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId, outsiderHouseholdId],
        userIds: [memberA.id, memberB.id, outsider.id, outsiderPartner.id],
      });
    }
  });
});

import { describe, expect, it } from "vitest";
import { createAdminClient, createAnonClient } from "../test-support/supabase-clients";
import {
  cleanupTestData,
  createTestHousehold,
  createTestUser,
  signInAs,
} from "../test-support/household-fixtures";
import { createCategory } from "./create-category";
import { listCategories } from "./list-categories";

describe("createCategory", () => {
  it("creates a category for the signed-in member's household", async () => {
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

      const category = await createCategory(anon, { householdId, name: "Restaurante" });

      expect(category.name).toBe("Restaurante");
      expect(category.householdId).toBe(householdId);
      expect(category.id).toBeTruthy();
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
      const category = await createCategory(anonA, { householdId, name: "Restaurante" });

      const anonB = createAnonClient();
      await signInAs(anonB, userB);
      const categories = await listCategories(anonB, { householdId });

      expect(categories.some((c) => c.id === category.id)).toBe(true);
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("rejects creating a category for another household (household-scoped isolation)", async () => {
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
        createCategory(anon, { householdId: otherHouseholdId, name: "Viagem" }),
      ).rejects.toThrow();
    } finally {
      await cleanupTestData(admin, {
        householdIds: [otherHouseholdId, outsiderHouseholdId],
        userIds: [outsider.id, outsiderPartner.id, memberA.id, memberB.id],
      });
    }
  });
});

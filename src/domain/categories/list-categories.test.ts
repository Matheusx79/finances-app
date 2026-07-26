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

describe("listCategories", () => {
  it("lists all categories for the signed-in member's household", async () => {
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

      await createCategory(anon, { householdId, name: "Restaurante" });
      await createCategory(anon, { householdId, name: "Viagem" });

      const categories = await listCategories(anon, { householdId });

      expect(categories.map((c) => c.name)).toEqual(
        expect.arrayContaining(["Restaurante", "Viagem"]),
      );
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("never returns another household's categories (household-scoped isolation)", async () => {
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
      await createCategory(anon, { householdId, name: "Restaurante" });

      const outsiderAnon = createAnonClient();
      await signInAs(outsiderAnon, outsider);
      await createCategory(outsiderAnon, { householdId: otherHouseholdId, name: "Viagem" });

      const categories = await listCategories(anon, { householdId });

      expect(categories.some((c) => c.householdId === otherHouseholdId)).toBe(false);
      expect(categories.some((c) => c.name === "Viagem")).toBe(false);
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId, otherHouseholdId],
        userIds: [userA.id, userB.id, outsider.id, outsiderPartner.id],
      });
    }
  });

  it("seeds sensible pt-BR default categories automatically when a household is created", async () => {
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

      const categories = await listCategories(anon, { householdId });

      expect(categories.map((c) => c.name).sort()).toEqual(
        ["Contas", "Lazer", "Mercado", "Moradia", "Saúde", "Transporte"].sort(),
      );
      expect(categories.every((c) => c.householdId === householdId)).toBe(true);
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });
});

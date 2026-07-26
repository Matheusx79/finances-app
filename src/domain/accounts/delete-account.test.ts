import { describe, expect, it } from "vitest";
import { createAdminClient, createAnonClient } from "../test-support/supabase-clients";
import {
  cleanupTestData,
  createTestHousehold,
  createTestUser,
  signInAs,
} from "../test-support/household-fixtures";
import { createAccount } from "./create-account";
import { deleteAccount } from "./delete-account";
import { listAccounts } from "./list-accounts";

describe("deleteAccount", () => {
  it("deletes an account belonging to the signed-in member's household", async () => {
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
      await deleteAccount(anon, { accountId: account.id });

      const accounts = await listAccounts(anon, { householdId });
      expect(accounts).toEqual([]);
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
      const account = await createAccount(anonA, { householdId, name: "Corrente" });

      const anonB = createAnonClient();
      await signInAs(anonB, userB);
      await deleteAccount(anonB, { accountId: account.id });

      const accounts = await listAccounts(anonA, { householdId });
      expect(accounts).toEqual([]);
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("rejects deleting another household's account (household-scoped isolation)", async () => {
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
      const account = await createAccount(anon, { householdId, name: "Corrente" });

      const outsiderAnon = createAnonClient();
      await signInAs(outsiderAnon, outsider);

      await expect(
        deleteAccount(outsiderAnon, { accountId: account.id }),
      ).rejects.toThrow();

      const accounts = await listAccounts(anon, { householdId });
      expect(accounts.map((a) => a.id)).toEqual([account.id]);
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId, outsiderHouseholdId],
        userIds: [memberA.id, memberB.id, outsider.id, outsiderPartner.id],
      });
    }
  });
});

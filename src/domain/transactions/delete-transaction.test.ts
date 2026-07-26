import { describe, expect, it } from "vitest";
import { createAdminClient, createAnonClient } from "../test-support/supabase-clients";
import {
  cleanupTestData,
  createTestHousehold,
  createTestUser,
  signInAs,
} from "../test-support/household-fixtures";
import { createAccount } from "../accounts/create-account";
import { createTransaction } from "./create-transaction";
import { deleteTransaction } from "./delete-transaction";
import { listTransactionsForMonth } from "./list-transactions-for-month";

describe("deleteTransaction", () => {
  it("deletes a transaction belonging to the signed-in member's household", async () => {
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
      const account = await createAccount(anon, { householdId, name: "Carteira" });
      const transaction = await createTransaction(anon, {
        householdId,
        type: "income",
        amount: 100,
        date: "2026-07-10",
        accountId: account.id,
      });

      await deleteTransaction(anon, { transactionId: transaction.id });

      const transactions = await listTransactionsForMonth(anon, {
        householdId,
        year: 2026,
        month: 7,
      });
      expect(transactions.some((t) => t.id === transaction.id)).toBe(false);
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("can be deleted by either household member regardless of who logged it", async () => {
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
      const account = await createAccount(anonA, { householdId, name: "Carteira" });
      const transaction = await createTransaction(anonA, {
        householdId,
        type: "income",
        amount: 100,
        date: "2026-07-10",
        accountId: account.id,
      });

      const anonB = createAnonClient();
      await signInAs(anonB, userB);
      await deleteTransaction(anonB, { transactionId: transaction.id });

      const transactions = await listTransactionsForMonth(anonA, {
        householdId,
        year: 2026,
        month: 7,
      });
      expect(transactions.some((t) => t.id === transaction.id)).toBe(false);
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("rejects deleting another household's transaction (household-scoped isolation)", async () => {
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
      const account = await createAccount(anon, { householdId, name: "Carteira" });
      const transaction = await createTransaction(anon, {
        householdId,
        type: "income",
        amount: 100,
        date: "2026-07-10",
        accountId: account.id,
      });

      const outsiderAnon = createAnonClient();
      await signInAs(outsiderAnon, outsider);

      await expect(
        deleteTransaction(outsiderAnon, { transactionId: transaction.id }),
      ).rejects.toThrow();

      const transactions = await listTransactionsForMonth(anon, {
        householdId,
        year: 2026,
        month: 7,
      });
      expect(transactions.some((t) => t.id === transaction.id)).toBe(true);
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId, outsiderHouseholdId],
        userIds: [memberA.id, memberB.id, outsider.id, outsiderPartner.id],
      });
    }
  });
});

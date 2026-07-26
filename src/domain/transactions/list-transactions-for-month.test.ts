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
import { listTransactionsForMonth } from "./list-transactions-for-month";

describe("listTransactionsForMonth", () => {
  it("only returns transactions within the queried calendar month, excluding boundary days in adjacent months", async () => {
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

      const lastDayOfJune = await createTransaction(anon, {
        householdId,
        type: "income",
        amount: 1,
        date: "2026-06-30",
        accountId: account.id,
      });
      const firstDayOfJuly = await createTransaction(anon, {
        householdId,
        type: "income",
        amount: 2,
        date: "2026-07-01",
        accountId: account.id,
      });
      const lastDayOfJuly = await createTransaction(anon, {
        householdId,
        type: "income",
        amount: 3,
        date: "2026-07-31",
        accountId: account.id,
      });
      const firstDayOfAugust = await createTransaction(anon, {
        householdId,
        type: "income",
        amount: 4,
        date: "2026-08-01",
        accountId: account.id,
      });

      const julyTransactions = await listTransactionsForMonth(anon, {
        householdId,
        year: 2026,
        month: 7,
      });

      const ids = julyTransactions.map((t) => t.id);
      expect(ids).toContain(firstDayOfJuly.id);
      expect(ids).toContain(lastDayOfJuly.id);
      expect(ids).not.toContain(lastDayOfJune.id);
      expect(ids).not.toContain(firstDayOfAugust.id);
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("handles the December-to-January year boundary", async () => {
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

      const lastDayOfDecember = await createTransaction(anon, {
        householdId,
        type: "income",
        amount: 1,
        date: "2026-12-31",
        accountId: account.id,
      });
      const firstDayOfJanuary = await createTransaction(anon, {
        householdId,
        type: "income",
        amount: 2,
        date: "2027-01-01",
        accountId: account.id,
      });

      const decemberTransactions = await listTransactionsForMonth(anon, {
        householdId,
        year: 2026,
        month: 12,
      });
      const januaryTransactions = await listTransactionsForMonth(anon, {
        householdId,
        year: 2027,
        month: 1,
      });

      expect(decemberTransactions.map((t) => t.id)).toContain(lastDayOfDecember.id);
      expect(decemberTransactions.map((t) => t.id)).not.toContain(firstDayOfJanuary.id);
      expect(januaryTransactions.map((t) => t.id)).toContain(firstDayOfJanuary.id);
      expect(januaryTransactions.map((t) => t.id)).not.toContain(lastDayOfDecember.id);
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
      const account = await createAccount(anonA, { householdId, name: "Carteira" });
      const transaction = await createTransaction(anonA, {
        householdId,
        type: "income",
        amount: 10,
        date: "2026-07-15",
        accountId: account.id,
      });

      const anonB = createAnonClient();
      await signInAs(anonB, userB);
      const transactions = await listTransactionsForMonth(anonB, {
        householdId,
        year: 2026,
        month: 7,
      });

      expect(transactions.some((t) => t.id === transaction.id)).toBe(true);
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("orders results newest-first by date", async () => {
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

      await createTransaction(anon, {
        householdId,
        type: "income",
        amount: 1,
        date: "2026-07-05",
        accountId: account.id,
      });
      await createTransaction(anon, {
        householdId,
        type: "income",
        amount: 2,
        date: "2026-07-20",
        accountId: account.id,
      });

      const transactions = await listTransactionsForMonth(anon, {
        householdId,
        year: 2026,
        month: 7,
      });

      expect(transactions.map((t) => t.date)).toEqual(["2026-07-20", "2026-07-05"]);
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("never returns another household's transactions (household-scoped isolation)", async () => {
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
      const account = await createAccount(anon, { householdId, name: "Carteira" });
      await createTransaction(anon, {
        householdId,
        type: "income",
        amount: 1,
        date: "2026-07-05",
        accountId: account.id,
      });

      const outsiderAnon = createAnonClient();
      await signInAs(outsiderAnon, outsider);
      const outsiderAccount = await createAccount(outsiderAnon, {
        householdId: otherHouseholdId,
        name: "Carteira",
      });
      await createTransaction(outsiderAnon, {
        householdId: otherHouseholdId,
        type: "income",
        amount: 2,
        date: "2026-07-05",
        accountId: outsiderAccount.id,
      });

      const transactions = await listTransactionsForMonth(anon, {
        householdId,
        year: 2026,
        month: 7,
      });

      expect(transactions.every((t) => t.householdId === householdId)).toBe(true);
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId, otherHouseholdId],
        userIds: [userA.id, userB.id, outsider.id, outsiderPartner.id],
      });
    }
  });
});

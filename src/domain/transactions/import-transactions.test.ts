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
import { importTransactions } from "./import-transactions";

describe("importTransactions", () => {
  it("inserts a normal batch of rows", async () => {
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
      const category = await createCategory(anon, { householdId, name: "Mercado" });

      const result = await importTransactions(anon, {
        householdId,
        accountId: account.id,
        rows: [
          {
            date: "2026-07-10",
            amount: 45.9,
            type: "expense",
            categoryId: category.id,
            fitid: "fit-1",
            description: "SUPERMERCADO ABC",
          },
          {
            date: "2026-07-05",
            amount: 5000,
            type: "income",
            categoryId: null,
            fitid: "fit-2",
            description: "SALARIO",
          },
        ],
      });

      expect(result.inserted).toHaveLength(2);
      expect(result.skipped).toHaveLength(0);
      expect(result.inserted.map((t) => t.amount).sort()).toEqual([45.9, 5000]);
      expect(result.inserted.find((t) => t.type === "expense")?.note).toBe("SUPERMERCADO ABC");
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("skips a row whose fitid already exists as an external_id on the same account", async () => {
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

      const firstRun = await importTransactions(anon, {
        householdId,
        accountId: account.id,
        rows: [
          { date: "2026-07-05", amount: 100, type: "income", categoryId: null, fitid: "dup-fit" },
        ],
      });
      expect(firstRun.inserted).toHaveLength(1);

      const secondRun = await importTransactions(anon, {
        householdId,
        accountId: account.id,
        rows: [
          { date: "2026-07-05", amount: 100, type: "income", categoryId: null, fitid: "dup-fit" },
          { date: "2026-07-06", amount: 200, type: "income", categoryId: null, fitid: "new-fit" },
        ],
      });

      expect(secondRun.inserted).toHaveLength(1);
      expect(secondRun.inserted[0].amount).toBe(200);
      expect(secondRun.skipped).toHaveLength(1);
      expect(secondRun.skipped[0].fitid).toBe("dup-fit");
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("does not treat the same fitid on a different account as a duplicate", async () => {
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
      const accountA = await createAccount(anon, { householdId, name: "Corrente" });
      const accountB = await createAccount(anon, { householdId, name: "Poupança" });

      await importTransactions(anon, {
        householdId,
        accountId: accountA.id,
        rows: [
          { date: "2026-07-05", amount: 100, type: "income", categoryId: null, fitid: "shared-fit" },
        ],
      });

      const result = await importTransactions(anon, {
        householdId,
        accountId: accountB.id,
        rows: [
          { date: "2026-07-05", amount: 100, type: "income", categoryId: null, fitid: "shared-fit" },
        ],
      });

      expect(result.inserted).toHaveLength(1);
      expect(result.skipped).toHaveLength(0);
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("rejects a batch containing an expense row with no category", async () => {
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

      await expect(
        importTransactions(anon, {
          householdId,
          accountId: account.id,
          rows: [
            { date: "2026-07-10", amount: 10, type: "expense", categoryId: null, fitid: "fit-x" },
          ],
        }),
      ).rejects.toThrow();
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("rejects an account that belongs to a different household (household-scoped isolation)", async () => {
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
      const outsiderAnon = createAnonClient();
      await signInAs(outsiderAnon, outsider);
      const outsiderAccount = await createAccount(outsiderAnon, {
        householdId: outsiderHouseholdId,
        name: "Carteira",
      });

      const anon = createAnonClient();
      await signInAs(anon, memberA);

      await expect(
        importTransactions(anon, {
          householdId,
          accountId: outsiderAccount.id,
          rows: [
            { date: "2026-07-10", amount: 10, type: "income", categoryId: null, fitid: "fit-y" },
          ],
        }),
      ).rejects.toThrow();
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId, outsiderHouseholdId],
        userIds: [memberA.id, memberB.id, outsider.id, outsiderPartner.id],
      });
    }
  });

  it("rejects an owner household member that belongs to a different household", async () => {
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
      const { data: outsiderMemberRow } = await admin
        .from("household_members")
        .select("id")
        .eq("household_id", outsiderHouseholdId)
        .eq("user_id", outsider.id)
        .single();

      const anon = createAnonClient();
      await signInAs(anon, memberA);
      const account = await createAccount(anon, { householdId, name: "Carteira" });

      await expect(
        importTransactions(anon, {
          householdId,
          accountId: account.id,
          ownerHouseholdMemberId: outsiderMemberRow!.id,
          rows: [
            { date: "2026-07-10", amount: 10, type: "income", categoryId: null, fitid: "fit-z" },
          ],
        }),
      ).rejects.toThrow();
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId, outsiderHouseholdId],
        userIds: [memberA.id, memberB.id, outsider.id, outsiderPartner.id],
      });
    }
  });
});

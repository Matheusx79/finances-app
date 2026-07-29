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
import { createTransaction } from "../transactions/create-transaction";
import { getMonthlyCashFlow } from "./get-monthly-cash-flow";

function currentYearMonth(monthsAgo: number): { year: number; month: number } {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - monthsAgo);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

function isoDate(year: number, month: number, day: number): string {
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day
    .toString()
    .padStart(2, "0")}`;
}

describe("getMonthlyCashFlow", () => {
  it("splits income/expense per owner across months, keeps zero months, isolates households", async () => {
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
      const account = await createAccount(anon, { householdId, name: "Corrente" });
      const category = await createCategory(anon, { householdId, name: "Mercado" });

      const { data: members } = await anon
        .from("household_members")
        .select("id, user_id")
        .eq("household_id", householdId);
      const aliceMemberId = members!.find(
        (m: { user_id: string }) => m.user_id === userA.id,
      )!.id;

      const thisMonth = currentYearMonth(0);
      const lastMonth = currentYearMonth(1);
      // monthsAgo=2 is left with zero transactions on purpose.

      await createTransaction(anon, {
        householdId,
        type: "income",
        amount: 1000,
        date: isoDate(thisMonth.year, thisMonth.month, 5),
        accountId: account.id,
        ownerHouseholdMemberId: aliceMemberId,
      });
      await createTransaction(anon, {
        householdId,
        type: "expense",
        amount: 200,
        date: isoDate(thisMonth.year, thisMonth.month, 10),
        accountId: account.id,
        categoryId: category.id,
      }); // shared (no owner)
      await createTransaction(anon, {
        householdId,
        type: "expense",
        amount: 50,
        date: isoDate(lastMonth.year, lastMonth.month, 15),
        accountId: account.id,
        categoryId: category.id,
        ownerHouseholdMemberId: aliceMemberId,
      });

      const outsiderAnon = createAnonClient();
      await signInAs(outsiderAnon, outsider);
      const outsiderAccount = await createAccount(outsiderAnon, {
        householdId: otherHouseholdId,
        name: "Corrente",
      });
      await createTransaction(outsiderAnon, {
        householdId: otherHouseholdId,
        type: "income",
        amount: 9999,
        date: isoDate(thisMonth.year, thisMonth.month, 5),
        accountId: outsiderAccount.id,
      });

      const result = await getMonthlyCashFlow(anon, { householdId, monthsBack: 3 });

      expect(result).toHaveLength(3);
      expect(result[2]).toEqual({
        year: thisMonth.year,
        month: thisMonth.month,
        totalsByOwner: {
          [aliceMemberId]: { income: 1000, expense: 0 },
          shared: { income: 0, expense: 200 },
        },
      });
      expect(result[1]).toEqual({
        year: lastMonth.year,
        month: lastMonth.month,
        totalsByOwner: {
          [aliceMemberId]: { income: 0, expense: 50 },
        },
      });
      // Oldest month has zero transactions but must still be present.
      expect(result[0].totalsByOwner).toEqual({});
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId, otherHouseholdId],
        userIds: [userA.id, userB.id, outsider.id, outsiderPartner.id],
      });
    }
  });
});

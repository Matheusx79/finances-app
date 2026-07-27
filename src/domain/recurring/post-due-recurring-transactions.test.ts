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
import { createRecurringTemplate } from "./create-recurring-template";
import { pauseRecurringTemplate } from "./pause-recurring-template";
import { postDueRecurringTransactions } from "./post-due-recurring-transactions";

describe("postDueRecurringTransactions", () => {
  it("posts a transaction for a template due today, referencing the template", async () => {
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
      const category = await createCategory(anon, { householdId, name: "Moradia" });

      const template = await createRecurringTemplate(anon, {
        householdId,
        type: "expense",
        amount: 89.9,
        dayOfMonth: 10,
        accountId: account.id,
        categoryId: category.id,
      });

      const posted = await postDueRecurringTransactions(anon, {
        householdId,
        today: new Date(2026, 6, 10), // 2026-07-10 — due today
      });

      expect(posted).toHaveLength(1);
      expect(posted[0].recurringTemplateId).toBe(template.id);
      expect(posted[0].amount).toBe(89.9);
      expect(posted[0].date).toBe("2026-07-10");
      expect(posted[0].accountId).toBe(account.id);
      expect(posted[0].categoryId).toBe(category.id);
      expect(posted[0].type).toBe("expense");
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("does not post a template whose due date is still later this month", async () => {
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

      await createRecurringTemplate(anon, {
        householdId,
        type: "income",
        amount: 3000,
        dayOfMonth: 25,
        accountId: account.id,
      });

      const posted = await postDueRecurringTransactions(anon, {
        householdId,
        today: new Date(2026, 6, 10), // 2026-07-10 — due date (25th) hasn't arrived
      });

      expect(posted).toHaveLength(0);
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("is idempotent: a second run on/after the due date within the same month does not double-post", async () => {
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

      await createRecurringTemplate(anon, {
        householdId,
        type: "income",
        amount: 200,
        dayOfMonth: 5,
        accountId: account.id,
      });

      const firstRun = await postDueRecurringTransactions(anon, {
        householdId,
        today: new Date(2026, 6, 5), // 2026-07-05 — due today
      });
      expect(firstRun).toHaveLength(1);

      // Simulates a second daily cron run a few days later, still in July.
      const secondRun = await postDueRecurringTransactions(anon, {
        householdId,
        today: new Date(2026, 6, 8), // 2026-07-08
      });
      expect(secondRun).toHaveLength(0);

      const { data: julyTransactions, error } = await anon
        .from("transactions")
        .select("id")
        .eq("household_id", householdId)
        .gte("date", "2026-07-01")
        .lt("date", "2026-08-01");
      expect(error).toBeNull();
      expect(julyTransactions).toHaveLength(1);
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("posts again in a later month once that month's due date arrives", async () => {
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

      await createRecurringTemplate(anon, {
        householdId,
        type: "income",
        amount: 200,
        dayOfMonth: 5,
        accountId: account.id,
      });

      const julyRun = await postDueRecurringTransactions(anon, {
        householdId,
        today: new Date(2026, 6, 5), // 2026-07-05
      });
      expect(julyRun).toHaveLength(1);

      const augustRun = await postDueRecurringTransactions(anon, {
        householdId,
        today: new Date(2026, 7, 5), // 2026-08-05
      });
      expect(augustRun).toHaveLength(1);
      expect(augustRun[0].date).toBe("2026-08-05");
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("clamps a day-of-month that doesn't exist in a shorter month to that month's last day", async () => {
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

      await createRecurringTemplate(anon, {
        householdId,
        type: "expense",
        amount: 45,
        dayOfMonth: 31,
        accountId: account.id,
        categoryId: (await createCategory(anon, { householdId, name: "Assinaturas" })).id,
      });

      // April has 30 days. Not yet due on the 29th...
      const tooEarly = await postDueRecurringTransactions(anon, {
        householdId,
        today: new Date(2026, 3, 29), // 2026-04-29
      });
      expect(tooEarly).toHaveLength(0);

      // ...but due on the 30th (April's last day), clamped from 31.
      const dueOnLastDay = await postDueRecurringTransactions(anon, {
        householdId,
        today: new Date(2026, 3, 30), // 2026-04-30
      });
      expect(dueOnLastDay).toHaveLength(1);
      expect(dueOnLastDay[0].date).toBe("2026-04-30");
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("does not post a paused template even when its due date has arrived", async () => {
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

      const template = await createRecurringTemplate(anon, {
        householdId,
        type: "income",
        amount: 200,
        dayOfMonth: 5,
        accountId: account.id,
      });
      await pauseRecurringTemplate(anon, { templateId: template.id });

      const posted = await postDueRecurringTransactions(anon, {
        householdId,
        today: new Date(2026, 6, 10), // 2026-07-10 — well past the 5th
      });

      expect(posted).toHaveLength(0);
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("never posts another household's due templates when scoped to householdId (household-scoped isolation)", async () => {
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
      await createRecurringTemplate(anon, {
        householdId,
        type: "income",
        amount: 200,
        dayOfMonth: 5,
        accountId: account.id,
      });

      const outsiderAnon = createAnonClient();
      await signInAs(outsiderAnon, outsider);
      const outsiderAccount = await createAccount(outsiderAnon, {
        householdId: otherHouseholdId,
        name: "Corrente",
      });
      await createRecurringTemplate(outsiderAnon, {
        householdId: otherHouseholdId,
        type: "income",
        amount: 9999,
        dayOfMonth: 5,
        accountId: outsiderAccount.id,
      });

      const posted = await postDueRecurringTransactions(anon, {
        householdId,
        today: new Date(2026, 6, 5), // 2026-07-05
      });

      expect(posted).toHaveLength(1);
      expect(posted.every((t) => t.householdId === householdId)).toBe(true);
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId, otherHouseholdId],
        userIds: [userA.id, userB.id, outsider.id, outsiderPartner.id],
      });
    }
  });

  it("posts due templates for every household when called without a householdId (the cron/admin-client path)", async () => {
    const admin = createAdminClient();
    const userA = await createTestUser(admin, "member-a");
    const userB = await createTestUser(admin, "member-b");
    const userC = await createTestUser(admin, "member-c");
    const userD = await createTestUser(admin, "member-d");
    const householdId1 = await createTestHousehold(admin, "Household 1", [
      { user: userA, displayName: "Alice" },
      { user: userB, displayName: "Bob" },
    ]);
    const householdId2 = await createTestHousehold(admin, "Household 2", [
      { user: userC, displayName: "Carol" },
      { user: userD, displayName: "Dave" },
    ]);

    try {
      const anon1 = createAnonClient();
      await signInAs(anon1, userA);
      const account1 = await createAccount(anon1, { householdId: householdId1, name: "Corrente" });
      await createRecurringTemplate(anon1, {
        householdId: householdId1,
        type: "income",
        amount: 100,
        dayOfMonth: 5,
        accountId: account1.id,
      });

      const anon2 = createAnonClient();
      await signInAs(anon2, userC);
      const account2 = await createAccount(anon2, { householdId: householdId2, name: "Corrente" });
      await createRecurringTemplate(anon2, {
        householdId: householdId2,
        type: "income",
        amount: 200,
        dayOfMonth: 5,
        accountId: account2.id,
      });

      // No householdId — behaves like the cron route's admin client, which
      // must act across every household.
      const posted = await postDueRecurringTransactions(admin, {
        today: new Date(2026, 6, 5), // 2026-07-05
      });

      const householdIdsPosted = posted.map((t) => t.householdId);
      expect(householdIdsPosted).toContain(householdId1);
      expect(householdIdsPosted).toContain(householdId2);
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId1, householdId2],
        userIds: [userA.id, userB.id, userC.id, userD.id],
      });
    }
  });
});

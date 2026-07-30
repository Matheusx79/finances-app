import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getHouseholdForUser } from "@/domain/household/get-household-for-user";
import { listAccounts } from "@/domain/accounts/list-accounts";
import { listCategories } from "@/domain/categories/list-categories";
import { listTransactionsForMonth } from "@/domain/transactions/list-transactions-for-month";
import { getBudgetProgressForMonth } from "@/domain/budgets/get-budget-progress-for-month";
import { getMonthlyCashFlow } from "@/domain/reports/get-monthly-cash-flow";
import type { Account } from "@/domain/accounts/types";
import type { Category } from "@/domain/categories/types";
import type { Transaction } from "@/domain/transactions/types";
import type { BudgetProgressForMonth } from "@/domain/budgets/types";
import type { MonthlyCashFlow } from "@/domain/reports/get-monthly-cash-flow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionSummary } from "@/components/transaction-summary";
import { CategoryBudgetCard } from "@/components/category-budget-progress";
import { CategorySpendingChart } from "@/components/category-spending-chart";
import { CashFlowChart } from "@/components/cash-flow-chart";
import { formatBRL } from "@/lib/currency";
import { MonthNav, formatMonthYearBR, resolveMonthParams } from "./month-nav";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string; mes?: string }>;
}) {
  const { ano, mes } = await searchParams;
  const { year, month } = resolveMonthParams(ano, mes);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const household = await getHouseholdForUser(supabase, { userId: user.id });
  const displayName =
    household?.members.find((member) => member.userId === user.id)?.displayName ?? user.email;

  let accounts: Account[] = [];
  let categories: Category[] = [];
  let transactions: Transaction[] = [];
  let budgetProgress: BudgetProgressForMonth | null = null;
  let cashFlow: MonthlyCashFlow[] = [];

  if (household) {
    [accounts, categories, transactions, budgetProgress, cashFlow] = await Promise.all([
      listAccounts(supabase, { householdId: household.id }),
      listCategories(supabase, { householdId: household.id }),
      listTransactionsForMonth(supabase, { householdId: household.id, year, month }),
      getBudgetProgressForMonth(supabase, { householdId: household.id, year, month }),
      getMonthlyCashFlow(supabase, { householdId: household.id, monthsBack: 6 }),
    ]);
  }

  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-4 lg:max-w-6xl lg:items-stretch">
      <div className="flex flex-col items-center gap-2 text-center lg:items-start lg:text-left">
        <h1 className="font-heading text-2xl font-semibold">Bem-vindo, {displayName}!</h1>
        {household && <p className="text-muted-foreground">{household.name}</p>}
      </div>

      {household && <MonthNav year={year} month={month} basePath="/dashboard" />}

      <div className="grid w-full gap-4 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-4">
          {household && budgetProgress && (
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Receita de {formatMonthYearBR(year, month)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-green-600 dark:text-green-400">
                  {formatBRL(budgetProgress.totalIncome)}
                </p>
              </CardContent>
            </Card>
          )}

          {household && budgetProgress && (
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Orçamento por categoria — {formatMonthYearBR(year, month)}</CardTitle>
              </CardHeader>
              <CardContent>
                {budgetProgress.categories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma categoria cadastrada ainda.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {budgetProgress.categories.map((category) => (
                      <li key={category.categoryId}>
                        <CategoryBudgetCard
                          categoryName={category.categoryName}
                          spentAmount={category.spentAmount}
                          budgetAmount={category.budgetAmount}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}

          {household && budgetProgress && (
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Gastos por categoria — {formatMonthYearBR(year, month)}</CardTitle>
              </CardHeader>
              <CardContent>
                <CategorySpendingChart categories={budgetProgress.categories} />
              </CardContent>
            </Card>
          )}

          {household && (
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Fluxo de caixa por pessoa</CardTitle>
              </CardHeader>
              <CardContent>
                <CashFlowChart cashFlow={cashFlow} members={household.members} />
              </CardContent>
            </Card>
          )}
        </div>

        {household && (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Transações recentes de {formatMonthYearBR(year, month)}</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma transação registrada neste mês ainda.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {transactions.map((transaction) => (
                    <li key={transaction.id} className="rounded-lg border border-border p-3">
                      <TransactionSummary
                        transaction={transaction}
                        accounts={accounts}
                        categories={categories}
                        members={household.members}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

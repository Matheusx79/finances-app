import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getHouseholdForUser } from "@/domain/household/get-household-for-user";
import { listAccounts } from "@/domain/accounts/list-accounts";
import { listCategories } from "@/domain/categories/list-categories";
import { listTransactionsForMonth } from "@/domain/transactions/list-transactions-for-month";
import type { Account } from "@/domain/accounts/types";
import type { Category } from "@/domain/categories/types";
import type { Transaction } from "@/domain/transactions/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionSummary } from "@/components/transaction-summary";
import { logout } from "./actions";

export default async function DashboardPage() {
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

  if (household) {
    const now = new Date();
    [accounts, categories, transactions] = await Promise.all([
      listAccounts(supabase, { householdId: household.id }),
      listCategories(supabase, { householdId: household.id }),
      listTransactionsForMonth(supabase, {
        householdId: household.id,
        year: now.getFullYear(),
        month: now.getMonth() + 1,
      }),
    ]);
  }

  return (
    <div className="flex min-h-screen flex-col items-center gap-4 bg-zinc-50 p-4 dark:bg-black">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold">Bem-vindo, {displayName}!</h1>
        {household && (
          <p className="text-zinc-600 dark:text-zinc-400">{household.name}</p>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          render={<Link href="/dashboard/transactions">Transações</Link>}
          nativeButton={false}
          variant="outline"
        />
        <Button
          render={<Link href="/dashboard/accounts">Contas</Link>}
          nativeButton={false}
          variant="outline"
        />
        <Button
          render={<Link href="/dashboard/categories">Categorias</Link>}
          nativeButton={false}
          variant="outline"
        />
        <form action={logout}>
          <Button type="submit" variant="outline">
            Sair
          </Button>
        </form>
      </div>

      {household && (
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Transações recentes deste mês</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Nenhuma transação registrada neste mês ainda.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {transactions.map((transaction) => (
                  <li
                    key={transaction.id}
                    className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                  >
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
  );
}

import Link from "next/link";
import { requireHousehold } from "@/lib/current-household";
import { listAccounts } from "@/domain/accounts/list-accounts";
import { listCategories } from "@/domain/categories/list-categories";
import { listTransactionsForMonth } from "@/domain/transactions/list-transactions-for-month";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionSummary } from "@/components/transaction-summary";
import { TransactionForm } from "./transaction-form";
import { createTransactionAction, deleteTransactionAction, updateTransactionAction } from "./actions";
import { PersonFilter, type PersonFilterValue } from "./person-filter";

const ERROR_MESSAGES: Record<string, string> = {
  "categoria-obrigatoria": "Categoria é obrigatória para despesas.",
};

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; responsavel?: string }>;
}) {
  const { erro, responsavel } = await searchParams;
  const { supabase, userId, householdId, household } = await requireHousehold();

  const me = household.members.find((member) => member.userId === userId);
  const partner = household.members.find((member) => member.userId !== userId);

  const activeFilter: PersonFilterValue =
    responsavel === "eu" && me
      ? "eu"
      : responsavel === "parceiro" && partner
        ? "parceiro"
        : "casal";
  const ownerHouseholdMemberId =
    activeFilter === "eu" ? me?.id : activeFilter === "parceiro" ? partner?.id : undefined;

  const now = new Date();
  const [accounts, categories, transactions] = await Promise.all([
    listAccounts(supabase, { householdId }),
    listCategories(supabase, { householdId }),
    listTransactionsForMonth(supabase, {
      householdId,
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      ownerHouseholdMemberId,
    }),
  ]);

  return (
    <div className="flex min-h-screen flex-col items-center gap-4 bg-zinc-50 p-4 dark:bg-black">
      <div className="flex w-full max-w-lg flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Transações</h1>
          <Button
            render={<Link href="/dashboard">Voltar</Link>}
            nativeButton={false}
            variant="outline"
            size="sm"
          />
        </div>

        {erro && (
          <p className="text-sm text-red-600" role="alert">
            {ERROR_MESSAGES[erro] ?? "Não foi possível salvar a transação."}
          </p>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Nova transação</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionForm
              action={createTransactionAction}
              accounts={accounts}
              categories={categories}
              members={household.members}
              submitLabel="Adicionar"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col items-start gap-3">
            <CardTitle>Transações do mês</CardTitle>
            <PersonFilter
              active={activeFilter}
              partnerName={partner?.displayName ?? "Parceiro(a)"}
              basePath="/dashboard/transactions"
            />
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
                    className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                  >
                    <TransactionSummary
                      transaction={transaction}
                      accounts={accounts}
                      categories={categories}
                      members={household.members}
                    />

                    <details>
                      <summary className="cursor-pointer text-sm text-zinc-600 underline dark:text-zinc-400">
                        Editar
                      </summary>
                      <div className="mt-2">
                        <TransactionForm
                          key={[
                            transaction.id,
                            transaction.amount,
                            transaction.date,
                            transaction.type,
                            transaction.accountId,
                            transaction.categoryId,
                            transaction.ownerHouseholdMemberId,
                            transaction.note,
                          ].join(":")}
                          action={updateTransactionAction}
                          accounts={accounts}
                          categories={categories}
                          members={household.members}
                          submitLabel="Salvar"
                          transaction={transaction}
                        />
                      </div>
                    </details>

                    <form action={deleteTransactionAction}>
                      <input type="hidden" name="transactionId" value={transaction.id} />
                      <Button type="submit" variant="destructive" size="sm">
                        Excluir
                      </Button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

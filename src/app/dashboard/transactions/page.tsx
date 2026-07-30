import Link from "next/link";
import { requireHousehold } from "@/lib/current-household";
import { listAccounts } from "@/domain/accounts/list-accounts";
import { listCategories } from "@/domain/categories/list-categories";
import { listTags } from "@/domain/tags/list-tags";
import { listTransactionsForMonth } from "@/domain/transactions/list-transactions-for-month";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionSummary } from "@/components/transaction-summary";
import { TransactionForm } from "./transaction-form";
import { createTransactionAction, deleteTransactionAction, updateTransactionAction } from "./actions";
import { PersonFilter, type PersonFilterValue } from "./person-filter";
import { TagFilter } from "./tag-filter";
import { MonthNav, formatMonthYearBR, resolveMonthParams } from "../month-nav";

const ERROR_MESSAGES: Record<string, string> = {
  "categoria-obrigatoria": "Categoria é obrigatória para despesas.",
};

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    erro?: string;
    responsavel?: string;
    ano?: string;
    mes?: string;
    etiqueta?: string;
  }>;
}) {
  const { erro, responsavel, ano, mes, etiqueta } = await searchParams;
  const { year, month } = resolveMonthParams(ano, mes);
  const { supabase, userId, householdId, household } = await requireHousehold();

  const me = household.members.find((member) => member.userId === userId);
  const partner = household.members.find((member) => member.userId !== userId);
  const toMemberIndex = (memberId: string | undefined): 0 | 1 | undefined => {
    const index = memberId ? household.members.findIndex((m) => m.id === memberId) : -1;
    return index === 0 || index === 1 ? index : undefined;
  };
  const meIndex = toMemberIndex(me?.id);
  const partnerIndex = toMemberIndex(partner?.id);

  const activeFilter: PersonFilterValue =
    responsavel === "eu" && me
      ? "eu"
      : responsavel === "parceiro" && partner
        ? "parceiro"
        : "casal";
  const ownerHouseholdMemberId =
    activeFilter === "eu" ? me?.id : activeFilter === "parceiro" ? partner?.id : undefined;

  const [accounts, categories, tags] = await Promise.all([
    listAccounts(supabase, { householdId }),
    listCategories(supabase, { householdId }),
    listTags(supabase, { householdId }),
  ]);

  const activeTagId = tags.some((tag) => tag.id === etiqueta) ? etiqueta : undefined;

  const transactions = await listTransactionsForMonth(supabase, {
    householdId,
    year,
    month,
    ownerHouseholdMemberId,
    tagId: activeTagId,
  });

  return (
    <div className="flex w-full max-w-lg flex-col gap-4 lg:max-w-5xl">
      <h1 className="font-heading text-xl font-semibold">Transações</h1>

      {erro && (
        <p className="text-sm text-destructive" role="alert">
          {ERROR_MESSAGES[erro] ?? "Não foi possível salvar a transação."}
        </p>
      )}

      <MonthNav
        year={year}
        month={month}
        basePath="/dashboard/transactions"
        extraParams={{ responsavel, etiqueta: activeTagId }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Nova transação</CardTitle>
          <CardAction>
            <Button
              render={<Link href="/dashboard/transactions/import">Importar extrato</Link>}
              nativeButton={false}
              variant="outline"
              size="sm"
            />
          </CardAction>
        </CardHeader>
        <CardContent>
          <TransactionForm
            action={createTransactionAction}
            accounts={accounts}
            categories={categories}
            members={household.members}
            tags={tags}
            submitLabel="Adicionar"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col items-start gap-3">
          <CardTitle>Transações de {formatMonthYearBR(year, month)}</CardTitle>
          <PersonFilter
            active={activeFilter}
            partnerName={partner?.displayName ?? "Parceiro(a)"}
            meIndex={meIndex}
            partnerIndex={partnerIndex}
            basePath="/dashboard/transactions"
            extraParams={{ ano: String(year), mes: String(month), etiqueta: activeTagId }}
          />
          <TagFilter
            tags={tags}
            active={activeTagId}
            basePath="/dashboard/transactions"
            extraParams={{ responsavel, ano: String(year), mes: String(month) }}
          />
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma transação registrada neste mês ainda.
            </p>
          ) : (
            <ul className="flex flex-col gap-3 lg:grid lg:grid-cols-2">
              {transactions.map((transaction) => (
                <li
                  key={transaction.id}
                  className="flex flex-col gap-2 rounded-lg border border-border p-3"
                >
                  <TransactionSummary
                    transaction={transaction}
                    accounts={accounts}
                    categories={categories}
                    members={household.members}
                    tags={tags}
                  />

                  <details>
                    <summary className="cursor-pointer text-sm text-muted-foreground underline">
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
                          transaction.tagIds.join(","),
                        ].join(":")}
                        action={updateTransactionAction}
                        accounts={accounts}
                        categories={categories}
                        members={household.members}
                        tags={tags}
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
  );
}

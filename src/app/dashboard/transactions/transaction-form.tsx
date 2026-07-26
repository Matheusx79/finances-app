import type { Account } from "@/domain/accounts/types";
import type { Category } from "@/domain/categories/types";
import type { HouseholdMember } from "@/domain/household/types";
import type { Transaction } from "@/domain/transactions/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SELECT_CLASSNAME =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

/**
 * Shared add/edit form. The category field is always shown (rather than
 * conditionally hidden for income) since there's no client-side JS in this
 * form to react to the type field — required-for-expense is enforced by the
 * server action (and, at the schema level, by the transactions table's
 * check constraint), with a label hint instead of a dynamic `required`.
 */
export function TransactionForm({
  action,
  accounts,
  categories,
  members,
  submitLabel,
  transaction,
}: {
  action: (formData: FormData) => Promise<void>;
  accounts: Account[];
  categories: Category[];
  members: HouseholdMember[];
  submitLabel: string;
  transaction?: Transaction;
}) {
  const fieldId = transaction?.id ?? "new";
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className="flex flex-col gap-3">
      {transaction && <input type="hidden" name="transactionId" value={transaction.id} />}

      <div className="flex flex-col gap-2">
        <Label htmlFor={`type-${fieldId}`}>Tipo</Label>
        <select
          id={`type-${fieldId}`}
          name="type"
          defaultValue={transaction?.type ?? "expense"}
          className={SELECT_CLASSNAME}
          required
        >
          <option value="expense">Despesa</option>
          <option value="income">Receita</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`amount-${fieldId}`}>Valor (R$)</Label>
        <Input
          id={`amount-${fieldId}`}
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          defaultValue={transaction?.amount}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`date-${fieldId}`}>Data</Label>
        <Input
          id={`date-${fieldId}`}
          name="date"
          type="date"
          defaultValue={transaction?.date ?? today}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`account-${fieldId}`}>Conta</Label>
        <select
          id={`account-${fieldId}`}
          name="accountId"
          defaultValue={transaction?.accountId ?? ""}
          className={SELECT_CLASSNAME}
          required
        >
          <option value="" disabled>
            Selecione
          </option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`category-${fieldId}`}>
          Categoria <span className="text-zinc-500">(obrigatória para despesas)</span>
        </Label>
        <select
          id={`category-${fieldId}`}
          name="categoryId"
          defaultValue={transaction?.categoryId ?? ""}
          className={SELECT_CLASSNAME}
        >
          <option value="">Nenhuma</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`owner-${fieldId}`}>Responsável</Label>
        <select
          id={`owner-${fieldId}`}
          name="owner"
          defaultValue={transaction?.ownerHouseholdMemberId ?? ""}
          className={SELECT_CLASSNAME}
        >
          <option value="">Compartilhado</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.displayName}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`note-${fieldId}`}>Observação</Label>
        <Input
          id={`note-${fieldId}`}
          name="note"
          defaultValue={transaction?.note ?? ""}
          placeholder="Opcional"
        />
      </div>

      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}

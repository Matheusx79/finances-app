"use client";

import { useState, useSyncExternalStore } from "react";
import type { Account } from "@/domain/accounts/types";
import type { Category } from "@/domain/categories/types";
import type { HouseholdMember } from "@/domain/household/types";
import type { Tag } from "@/domain/tags/types";
import type { Transaction } from "@/domain/transactions/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SELECT_CLASSNAME =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

// Per-device "remember my last pick" (ADR-0004/0005 grilling decision) —
// only used to prefill the *new*-transaction form, never an edit, and only
// as an initial value the user can freely change. Deliberately localStorage
// rather than a DB-derived default: no schema change, no extra query, and
// "last picked on my phone" is a better signal than "household's most
// recent transaction" for a couple where each half mostly logs their own card.
const LAST_ACCOUNT_KEY = "finances-app:last-account-id";
const LAST_OWNER_KEY = "finances-app:last-owner-id";

// No cross-tab live updates needed — this hook only cares about the value
// at first client render, so the store never notifies of changes.
function subscribeToNothing() {
  return () => {};
}

// useSyncExternalStore (not a useEffect+setState) is the React-sanctioned
// way to read an external store like localStorage: `getServerSnapshot`
// gives the SSR/pre-hydration render a real value (null) instead of
// reading `localStorage` where it doesn't exist, so there's no hydration
// mismatch, and no synchronous setState-in-effect to trigger a cascading
// re-render.
function useLastPicked(key: string): string | null {
  return useSyncExternalStore(
    subscribeToNothing,
    () => localStorage.getItem(key),
    () => null,
  );
}

/**
 * Shared add/edit form. The category field is always shown (rather than
 * conditionally hidden for income) — no type-reactive show/hide logic is
 * wired up, so required-for-expense is enforced by the server action (and,
 * at the schema level, by the transactions table's check constraint), with
 * a label hint instead of a dynamic `required`. This predates the form
 * becoming a client component for the account/owner defaults below; adding
 * that show/hide behavior now would be unrelated scope creep, not a
 * consequence of this change.
 */
export function TransactionForm({
  action,
  accounts,
  categories,
  members,
  tags,
  submitLabel,
  transaction,
}: {
  action: (formData: FormData) => Promise<void>;
  accounts: Account[];
  categories: Category[];
  members: HouseholdMember[];
  tags: Tag[];
  submitLabel: string;
  transaction?: Transaction;
}) {
  const fieldId = transaction?.id ?? "new";
  const today = new Date().toISOString().slice(0, 10);
  const isNew = !transaction;

  const lastAccountId = useLastPicked(LAST_ACCOUNT_KEY);
  const lastOwnerId = useLastPicked(LAST_OWNER_KEY);
  const defaultAccountId =
    isNew && lastAccountId && accounts.some((account) => account.id === lastAccountId) ? lastAccountId : "";
  const defaultOwnerId =
    isNew && lastOwnerId && members.some((member) => member.id === lastOwnerId) ? lastOwnerId : "";

  // null = user hasn't touched the select yet, so it should track the
  // derived default (which switches from "" to the remembered value once
  // useSyncExternalStore resolves it); once the user picks something, that
  // explicit choice wins even if it happens to be "".
  const [userAccountId, setUserAccountId] = useState<string | null>(null);
  const [userOwnerId, setUserOwnerId] = useState<string | null>(null);

  const accountId = userAccountId ?? (transaction ? transaction.accountId : defaultAccountId);
  const ownerId = userOwnerId ?? (transaction ? (transaction.ownerHouseholdMemberId ?? "") : defaultOwnerId);

  function rememberChoicesForNextTime() {
    if (!isNew) return;
    localStorage.setItem(LAST_ACCOUNT_KEY, accountId);
    localStorage.setItem(LAST_OWNER_KEY, ownerId);
  }

  return (
    <form
      action={action}
      onSubmit={rememberChoicesForNextTime}
      className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-4 lg:gap-y-3"
    >
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
          value={accountId}
          onChange={(e) => setUserAccountId(e.target.value)}
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
          Categoria <span className="text-muted-foreground">(obrigatória para despesas)</span>
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
          value={ownerId}
          onChange={(e) => setUserOwnerId(e.target.value)}
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

      {tags.length > 0 && (
        <div className="flex flex-col gap-2 lg:col-span-2">
          <Label>Etiquetas</Label>
          <div className="flex flex-wrap gap-3">
            {tags.map((tag) => (
              <label key={tag.id} className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  name="tagIds"
                  value={tag.id}
                  defaultChecked={transaction?.tagIds.includes(tag.id) ?? false}
                />
                {tag.name}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 lg:col-span-2">
        <Label htmlFor={`note-${fieldId}`}>Observação</Label>
        <Input
          id={`note-${fieldId}`}
          name="note"
          defaultValue={transaction?.note ?? ""}
          placeholder="Opcional"
        />
      </div>

      <Button type="submit" className="lg:col-span-2">
        {submitLabel}
      </Button>
    </form>
  );
}

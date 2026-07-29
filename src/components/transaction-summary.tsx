import type { Account } from "@/domain/accounts/types";
import type { Category } from "@/domain/categories/types";
import type { HouseholdMember } from "@/domain/household/types";
import type { Tag } from "@/domain/tags/types";
import type { Transaction } from "@/domain/transactions/types";
import { formatBRL, formatDateBR } from "@/lib/currency";
import { memberAccent } from "@/lib/member-color";

/**
 * Shared read-only rendering of a transaction (date, type-colored amount,
 * category/account/owner, optional note) — used by both the dashboard's
 * recent-transactions feed and the full transactions list, so the two views
 * can't drift on how a transaction is summarized.
 */
export function TransactionSummary({
  transaction,
  accounts,
  categories,
  members,
  tags,
}: {
  transaction: Transaction;
  accounts: Account[];
  categories: Category[];
  members: HouseholdMember[];
  tags?: Tag[];
}) {
  const accountName = accounts.find((account) => account.id === transaction.accountId)?.name;
  const categoryName = transaction.categoryId
    ? categories.find((category) => category.id === transaction.categoryId)?.name
    : null;
  const ownerIndex = transaction.ownerHouseholdMemberId
    ? members.findIndex((member) => member.id === transaction.ownerHouseholdMemberId)
    : -1;
  const ownerName = transaction.ownerHouseholdMemberId
    ? (members.find((member) => member.id === transaction.ownerHouseholdMemberId)?.displayName ??
      "—")
    : "Compartilhado";
  const ownerColor = ownerIndex === 0 || ownerIndex === 1 ? memberAccent(ownerIndex).color : undefined;
  const leadingParts = [categoryName, accountName ?? "—"].filter(Boolean);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          {formatDateBR(transaction.date)}
        </span>
        <span
          className={
            transaction.type === "expense"
              ? "font-medium text-red-600 dark:text-red-400"
              : "font-medium text-green-600 dark:text-green-400"
          }
        >
          {transaction.type === "expense" ? "-" : "+"}
          {formatBRL(transaction.amount)}
        </span>
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {leadingParts.length > 0 && `${leadingParts.join(" · ")} · `}
        <span style={ownerColor ? { color: ownerColor } : undefined}>{ownerName}</span>
      </p>
      {transaction.note && (
        <p className="text-sm text-zinc-600 italic dark:text-zinc-400">{transaction.note}</p>
      )}
      {tags && transaction.tagIds.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {transaction.tagIds.map((tagId) => {
            const tagName = tags.find((tag) => tag.id === tagId)?.name;
            return tagName ? (
              <span
                key={tagId}
                className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {tagName}
              </span>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}

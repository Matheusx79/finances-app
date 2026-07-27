import type { ReactNode } from "react";
import { Progress } from "@/components/ui/progress";
import { formatBRL } from "@/lib/currency";
import { cn } from "@/lib/utils";

function isOverBudget(budgetAmount: number | null, spentAmount: number): boolean {
  return budgetAmount !== null && spentAmount > budgetAmount;
}

/** Spent/budget/Restante readout with a progress bar, shared by the dashboard-home widget and the dedicated budgets page. */
export function CategoryBudgetProgress({
  categoryName,
  spentAmount,
  budgetAmount,
}: {
  categoryName: string;
  spentAmount: number;
  budgetAmount: number | null;
}) {
  const overBudget = isOverBudget(budgetAmount, spentAmount);
  const percent = budgetAmount ? (spentAmount / budgetAmount) * 100 : 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">{categoryName}</span>
        <span
          className={cn(
            "text-sm font-medium",
            overBudget ? "text-red-600 dark:text-red-400" : "text-zinc-600 dark:text-zinc-400",
          )}
        >
          {formatBRL(spentAmount)}
          {budgetAmount !== null ? ` / ${formatBRL(budgetAmount)}` : " (sem orçamento definido)"}
        </span>
      </div>
      {budgetAmount !== null && (
        <>
          <Progress
            value={percent}
            indicatorClassName={overBudget ? "bg-red-600 dark:bg-red-500" : undefined}
          />
          <span
            className={cn(
              "text-xs font-medium",
              overBudget ? "text-red-600 dark:text-red-400" : "text-zinc-500 dark:text-zinc-400",
            )}
          >
            Restante: {formatBRL(budgetAmount - spentAmount)}
            {overBudget && " · Acima do orçamento"}
          </span>
        </>
      )}
    </div>
  );
}

/** Bordered card wrapping `CategoryBudgetProgress`, flagged red when over budget — shared so the over-budget styling isn't recomputed at each call site. */
export function CategoryBudgetCard({
  categoryName,
  spentAmount,
  budgetAmount,
  children,
  className,
}: {
  categoryName: string;
  spentAmount: number;
  budgetAmount: number | null;
  children?: ReactNode;
  className?: string;
}) {
  const overBudget = isOverBudget(budgetAmount, spentAmount);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border p-3",
        overBudget
          ? "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/40"
          : "border-zinc-200 dark:border-zinc-800",
        className,
      )}
    >
      <CategoryBudgetProgress
        categoryName={categoryName}
        spentAmount={spentAmount}
        budgetAmount={budgetAmount}
      />
      {children}
    </div>
  );
}

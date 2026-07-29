"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CategoryBudgetProgress } from "@/domain/budgets/types";
import { formatBRL } from "@/lib/currency";

/**
 * Horizontal bar chart of spending by category for a month, fed from
 * `getBudgetProgressForMonth`'s `categories` (categoryName/spentAmount).
 * Categories with no spending are dropped so the chart only shows what was
 * actually spent; if that leaves nothing, renders a text empty state instead
 * of an empty/broken chart.
 */
export function CategorySpendingChart({ categories }: { categories: CategoryBudgetProgress[] }) {
  const data = categories
    .filter((category) => category.spentAmount > 0)
    .sort((a, b) => b.spentAmount - a.spentAmount);

  if (data.length === 0) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">Sem gastos neste mês.</p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(120, data.length * 40)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
        <CartesianGrid horizontal={false} stroke="var(--border)" />
        <XAxis
          type="number"
          tickFormatter={(value: number) => formatBRL(value)}
          stroke="var(--muted-foreground)"
          fontSize={12}
        />
        <YAxis
          type="category"
          dataKey="categoryName"
          width={100}
          stroke="var(--muted-foreground)"
          fontSize={12}
        />
        <Tooltip
          formatter={(value) => formatBRL(Number(value))}
          contentStyle={{
            background: "var(--popover)",
            color: "var(--popover-foreground)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
          }}
        />
        <Bar dataKey="spentAmount" fill="var(--primary)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

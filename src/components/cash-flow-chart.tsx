"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MonthlyCashFlow } from "@/domain/reports/get-monthly-cash-flow";
import type { HouseholdMember } from "@/domain/household/types";
import { formatBRL } from "@/lib/currency";
import { memberAccent } from "@/lib/member-color";

const MONTH_LABELS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

const SHARED_COLOR = "var(--muted-foreground)";

/**
 * Monthly entradas (positive, above axis) vs. saídas (negative, below axis)
 * stacked by household member, fed from `getMonthlyCashFlow`. Expense values
 * are negated so income/expense bars stack on opposite sides of the zero
 * line — the standard cash-flow chart shape.
 */
export function CashFlowChart({
  cashFlow,
  members,
}: {
  cashFlow: MonthlyCashFlow[];
  members: HouseholdMember[];
}) {
  const data = cashFlow.map((month) => {
    const row: Record<string, number | string> = {
      label: `${MONTH_LABELS[month.month - 1]}/${month.year.toString().slice(2)}`,
    };
    for (const [ownerKey, totals] of Object.entries(month.totalsByOwner)) {
      row[`${ownerKey}_income`] = totals.income;
      row[`${ownerKey}_expense`] = -totals.expense;
    }
    return row;
  });

  const ownerBars = [
    ...members.slice(0, 2).map((member, index) => ({
      key: member.id,
      name: member.displayName,
      color: memberAccent(index as 0 | 1).color,
    })),
    { key: "shared", name: "Compartilhado", color: SHARED_COLOR },
  ];

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ left: 8, right: 8 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={12} />
        <YAxis
          tickFormatter={(value: number) => formatBRL(value)}
          stroke="var(--muted-foreground)"
          fontSize={12}
          width={80}
        />
        <Tooltip
          formatter={(value) => formatBRL(Math.abs(Number(value)))}
          contentStyle={{
            background: "var(--popover)",
            color: "var(--popover-foreground)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {ownerBars.map((owner) => (
          <Bar
            key={`${owner.key}_income`}
            dataKey={`${owner.key}_income`}
            name={`${owner.name} (entrada)`}
            stackId="income"
            fill={owner.color}
          />
        ))}
        {ownerBars.map((owner) => (
          <Bar
            key={`${owner.key}_expense`}
            dataKey={`${owner.key}_expense`}
            name={`${owner.name} (saída)`}
            stackId="expense"
            fill={owner.color}
            fillOpacity={0.5}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

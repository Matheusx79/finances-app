import Link from "next/link";
import { requireHousehold } from "@/lib/current-household";
import { getBudgetProgressForMonth } from "@/domain/budgets/get-budget-progress-for-month";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL } from "@/lib/currency";
import { setCategoryBudgetAction } from "./actions";

/** e.g. "julho de 2026" — display-only, not used for date storage/comparison. */
function formatMonthYearBR(year: number, month: number): string {
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
    new Date(year, month - 1, 1),
  );
}

export default async function BudgetsPage() {
  const { supabase, householdId } = await requireHousehold();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const progress = await getBudgetProgressForMonth(supabase, { householdId, year, month });

  return (
    <div className="flex min-h-screen flex-col items-center gap-4 bg-zinc-50 p-4 dark:bg-black">
      <div className="flex w-full max-w-sm flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Orçamentos</h1>
          <Button
            render={<Link href="/dashboard">Voltar</Link>}
            nativeButton={false}
            variant="outline"
            size="sm"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Orçamento por categoria — {formatMonthYearBR(year, month)}</CardTitle>
          </CardHeader>
          <CardContent>
            {progress.categories.length === 0 ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Nenhuma categoria cadastrada ainda.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {progress.categories.map((category) => (
                  <li
                    key={category.categoryId}
                    className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{category.categoryName}</span>
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        Gasto até agora: {formatBRL(category.spentAmount)}
                      </span>
                    </div>
                    <form
                      // Keyed on the current budget amount so a save doesn't leave the
                      // uncontrolled Input holding a stale defaultValue after revalidation
                      // (same fix as the transaction edit form's Base UI warning).
                      key={category.budgetAmount ?? "unset"}
                      action={setCategoryBudgetAction}
                      className="flex gap-2"
                    >
                      <input type="hidden" name="categoryId" value={category.categoryId} />
                      <input type="hidden" name="year" value={year} />
                      <input type="hidden" name="month" value={month} />
                      <div className="flex flex-1 flex-col gap-1">
                        <Label htmlFor={`amount-${category.categoryId}`} className="sr-only">
                          Orçamento de {category.categoryName}
                        </Label>
                        <Input
                          id={`amount-${category.categoryId}`}
                          name="amount"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Orçamento (R$)"
                          defaultValue={category.budgetAmount ?? undefined}
                          required
                        />
                      </div>
                      <Button type="submit" variant="outline" size="sm">
                        Salvar
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

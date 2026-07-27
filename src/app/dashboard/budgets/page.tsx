import { requireHousehold } from "@/lib/current-household";
import { getBudgetProgressForMonth } from "@/domain/budgets/get-budget-progress-for-month";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryBudgetCard } from "@/components/category-budget-progress";
import { setCategoryBudgetAction } from "./actions";
import { formatMonthYearBR } from "../month-nav";

export default async function BudgetsPage() {
  const { supabase, householdId } = await requireHousehold();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const progress = await getBudgetProgressForMonth(supabase, { householdId, year, month });

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <h1 className="text-xl font-semibold">Orçamentos</h1>

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
                <li key={category.categoryId}>
                  <CategoryBudgetCard
                    categoryName={category.categoryName}
                    spentAmount={category.spentAmount}
                    budgetAmount={category.budgetAmount}
                  >
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
                  </CategoryBudgetCard>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

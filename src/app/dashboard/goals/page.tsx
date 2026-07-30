import { requireHousehold } from "@/lib/current-household";
import { listAccounts } from "@/domain/accounts/list-accounts";
import { listGoals } from "@/domain/goals/list-goals";
import { formatBRL, formatDateBR } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createGoalAction, deleteGoalAction, updateGoalAction } from "./actions";

const SELECT_CLASSNAME =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

const ERROR_MESSAGES: Record<string, string> = {
  "conta-ja-vinculada": "Essa conta já está vinculada a outra meta.",
};

export default async function GoalsPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const errorMessage = erro ? (ERROR_MESSAGES[erro] ?? "Não foi possível salvar a meta.") : null;

  const { supabase, householdId } = await requireHousehold();
  const [accounts, goals] = await Promise.all([
    listAccounts(supabase, { householdId }),
    listGoals(supabase, { householdId }),
  ]);

  const activeGoals = goals.filter((goal) => !goal.completed);
  const completedGoals = goals.filter((goal) => goal.completed);

  return (
    <div className="flex w-full max-w-sm flex-col gap-4 lg:max-w-5xl">
      <h1 className="font-heading text-2xl font-medium">Metas</h1>

      {errorMessage && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      <Card className="lg:max-w-sm">
        <CardHeader>
          <CardTitle>Nova meta</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createGoalAction} className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" placeholder="Ex.: Viagem" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="accountId">Conta</Label>
              <select id="accountId" name="accountId" className={SELECT_CLASSNAME} defaultValue="" required>
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
              <Label htmlFor="targetAmount">Valor alvo (R$)</Label>
              <Input
                id="targetAmount"
                name="targetAmount"
                type="number"
                step="0.01"
                min="0.01"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="targetDate">
                Data alvo <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Input id="targetDate" name="targetDate" type="date" />
            </div>
            <Button type="submit">Adicionar</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Metas ativas</CardTitle>
        </CardHeader>
        <CardContent>
          {activeGoals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma meta ativa ainda.</p>
          ) : (
            <ul className="flex flex-col gap-4 lg:grid lg:grid-cols-2 xl:grid-cols-3">
              {activeGoals.map((goal) => (
                <GoalListItem key={goal.id} goal={goal} accounts={accounts} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {completedGoals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Metas concluídas</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-4 lg:grid lg:grid-cols-2 xl:grid-cols-3">
              {completedGoals.map((goal) => (
                <GoalListItem key={goal.id} goal={goal} accounts={accounts} />
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function GoalListItem({
  goal,
  accounts,
}: {
  goal: Awaited<ReturnType<typeof listGoals>>[number];
  accounts: Awaited<ReturnType<typeof listAccounts>>;
}) {
  const percent = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-border p-3">
      <div className="flex flex-col gap-1">
        <span className="font-heading text-base font-medium">{goal.name}</span>
        <span className="text-2xl font-semibold">{formatBRL(goal.currentAmount)}</span>
        <span className="text-xs text-muted-foreground">
          de {formatBRL(goal.targetAmount)}
          {goal.targetDate && ` · até ${formatDateBR(goal.targetDate)}`}
        </span>
      </div>
      <Progress value={percent} />

      <form action={updateGoalAction} className="flex flex-col gap-2">
        <input type="hidden" name="goalId" value={goal.id} />
        <Input name="name" defaultValue={goal.name} aria-label={`Nome da meta ${goal.name}`} required />
        <select
          name="accountId"
          defaultValue={goal.accountId}
          className={SELECT_CLASSNAME}
          aria-label={`Conta da meta ${goal.name}`}
          required
        >
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <Input
            name="targetAmount"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={goal.targetAmount}
            aria-label={`Valor alvo da meta ${goal.name}`}
            required
          />
          <Input
            name="targetDate"
            type="date"
            defaultValue={goal.targetDate ?? ""}
            aria-label={`Data alvo da meta ${goal.name}`}
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" variant="outline" size="sm" className="flex-1">
            Salvar
          </Button>
        </div>
      </form>
      <form action={deleteGoalAction}>
        <input type="hidden" name="goalId" value={goal.id} />
        <Button type="submit" variant="destructive" size="sm" className="w-full">
          Excluir
        </Button>
      </form>
    </li>
  );
}

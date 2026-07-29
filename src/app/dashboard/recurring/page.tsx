import { requireHousehold } from "@/lib/current-household";
import { listAccounts } from "@/domain/accounts/list-accounts";
import { listCategories } from "@/domain/categories/list-categories";
import { listRecurringTemplates } from "@/domain/recurring/list-recurring-templates";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL } from "@/lib/currency";
import { memberAccent } from "@/lib/member-color";
import { RecurringTemplateForm } from "./recurring-template-form";
import {
  createRecurringTemplateAction,
  deleteRecurringTemplateAction,
  pauseRecurringTemplateAction,
  resumeRecurringTemplateAction,
  updateRecurringTemplateAction,
} from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  "categoria-obrigatoria": "Categoria é obrigatória para despesas.",
};

export default async function RecurringPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const { supabase, householdId, household } = await requireHousehold();

  const [accounts, categories, templates] = await Promise.all([
    listAccounts(supabase, { householdId }),
    listCategories(supabase, { householdId }),
    listRecurringTemplates(supabase, { householdId }),
  ]);

  return (
    <div className="flex w-full max-w-lg flex-col gap-4 lg:max-w-5xl">
      <h1 className="text-xl font-semibold">Transações recorrentes</h1>

      {erro && (
        <p className="text-sm text-red-600" role="alert">
          {ERROR_MESSAGES[erro] ?? "Não foi possível salvar o modelo recorrente."}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Novo modelo recorrente</CardTitle>
        </CardHeader>
        <CardContent>
          <RecurringTemplateForm
            action={createRecurringTemplateAction}
            accounts={accounts}
            categories={categories}
            members={household.members}
            submitLabel="Adicionar"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Modelos cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Nenhum modelo recorrente cadastrado ainda.
            </p>
          ) : (
            <ul className="flex flex-col gap-3 lg:grid lg:grid-cols-2">
              {templates.map((template) => {
                const accountName = accounts.find((a) => a.id === template.accountId)?.name;
                const categoryName = template.categoryId
                  ? categories.find((c) => c.id === template.categoryId)?.name
                  : null;
                const ownerIndex = template.ownerHouseholdMemberId
                  ? household.members.findIndex((m) => m.id === template.ownerHouseholdMemberId)
                  : -1;
                const ownerName = template.ownerHouseholdMemberId
                  ? (household.members.find((m) => m.id === template.ownerHouseholdMemberId)
                      ?.displayName ?? "—")
                  : "Compartilhado";
                const ownerColor =
                  ownerIndex === 0 || ownerIndex === 1 ? memberAccent(ownerIndex).color : undefined;
                const leadingParts = [categoryName, accountName ?? "—"].filter(Boolean);

                return (
                  <li
                    key={template.id}
                    className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={
                          template.type === "expense"
                            ? "font-medium text-red-600 dark:text-red-400"
                            : "font-medium text-green-600 dark:text-green-400"
                        }
                      >
                        {template.type === "expense" ? "-" : "+"}
                        {formatBRL(template.amount)}
                      </span>
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        Todo dia {template.dayOfMonth}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {leadingParts.length > 0 && `${leadingParts.join(" · ")} · `}
                      <span style={ownerColor ? { color: ownerColor } : undefined}>
                        {ownerName}
                      </span>
                    </p>
                    <p className="text-xs font-medium">
                      {template.active ? (
                        <span className="text-green-600 dark:text-green-400">Ativo</span>
                      ) : (
                        <span className="text-zinc-500">Pausado</span>
                      )}
                    </p>

                    <details>
                      <summary className="cursor-pointer text-sm text-zinc-600 underline dark:text-zinc-400">
                        Editar
                      </summary>
                      <div className="mt-2">
                        <RecurringTemplateForm
                          key={[
                            template.id,
                            template.amount,
                            template.type,
                            template.dayOfMonth,
                            template.accountId,
                            template.categoryId,
                            template.ownerHouseholdMemberId,
                          ].join(":")}
                          action={updateRecurringTemplateAction}
                          accounts={accounts}
                          categories={categories}
                          members={household.members}
                          submitLabel="Salvar"
                          template={template}
                        />
                      </div>
                    </details>

                    <div className="flex flex-wrap gap-2">
                      {template.active ? (
                        <form action={pauseRecurringTemplateAction}>
                          <input type="hidden" name="templateId" value={template.id} />
                          <Button type="submit" variant="outline" size="sm">
                            Pausar
                          </Button>
                        </form>
                      ) : (
                        <form action={resumeRecurringTemplateAction}>
                          <input type="hidden" name="templateId" value={template.id} />
                          <Button type="submit" variant="outline" size="sm">
                            Reativar
                          </Button>
                        </form>
                      )}
                      <form action={deleteRecurringTemplateAction}>
                        <input type="hidden" name="templateId" value={template.id} />
                        <Button type="submit" variant="destructive" size="sm">
                          Excluir
                        </Button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

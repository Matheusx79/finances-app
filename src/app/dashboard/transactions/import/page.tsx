import { redirect } from "next/navigation";
import { requireHousehold } from "@/lib/current-household";
import { listAccounts } from "@/domain/accounts/list-accounts";
import { listCategories } from "@/domain/categories/list-categories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { uploadOfxAction, confirmOfxImportAction } from "./actions";
import { OfxUploadForm } from "./ofx-upload-form";
import { OfxStagingForm } from "./ofx-staging-form";
import { decodeOfxBatch } from "./batch-codec";

const ERROR_MESSAGES: Record<string, string> = {
  "campos-obrigatorios": "Selecione o arquivo, a conta e o responsável.",
  "conta-ou-responsavel-invalido": "Conta ou responsável inválido.",
  "ofx-invalido": "Não foi possível ler esse arquivo OFX.",
};

export default async function ImportOfxPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; batch?: string; accountId?: string; ownerId?: string }>;
}) {
  const { erro, batch, accountId, ownerId } = await searchParams;
  const { supabase, householdId, household } = await requireHousehold();

  const [accounts, categories] = await Promise.all([
    listAccounts(supabase, { householdId }),
    listCategories(supabase, { householdId }),
  ]);

  const errorMessage = erro ? (ERROR_MESSAGES[erro] ?? "Não foi possível importar o extrato.") : null;

  if (batch) {
    const account = accounts.find((a) => a.id === accountId);
    const owner = household.members.find((m) => m.id === ownerId);
    if (!account || !owner) {
      redirect("/dashboard/transactions/import?erro=conta-ou-responsavel-invalido");
    }

    let rows;
    try {
      rows = decodeOfxBatch(batch);
    } catch {
      redirect("/dashboard/transactions/import?erro=ofx-invalido");
    }

    return (
      <div className="flex w-full max-w-lg flex-col gap-4 lg:max-w-3xl">
        <h1 className="text-xl font-semibold">Importar extrato</h1>

        <Card>
          <CardHeader>
            <CardTitle>Revisar transações</CardTitle>
          </CardHeader>
          <CardContent>
            <OfxStagingForm
              action={confirmOfxImportAction}
              rows={rows}
              categories={categories}
              accountId={account.id}
              ownerId={owner.id}
              accountName={account.name}
              ownerName={owner.displayName}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-lg flex-col gap-4 lg:max-w-3xl">
      <h1 className="text-xl font-semibold">Importar extrato</h1>

      {errorMessage && (
        <p className="text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Selecionar arquivo</CardTitle>
        </CardHeader>
        <CardContent>
          <OfxUploadForm action={uploadOfxAction} accounts={accounts} members={household.members} />
        </CardContent>
      </Card>
    </div>
  );
}

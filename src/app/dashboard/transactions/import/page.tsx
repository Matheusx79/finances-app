import { redirect } from "next/navigation";
import { requireHousehold } from "@/lib/current-household";
import { listAccounts } from "@/domain/accounts/list-accounts";
import { listCategories } from "@/domain/categories/list-categories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { uploadOfxAction, confirmOfxImportAction, pasteCardBillAction } from "./actions";
import { OfxUploadForm } from "./ofx-upload-form";
import { OfxStagingForm } from "./ofx-staging-form";
import { CardBillPasteForm } from "./card-bill-paste-form";
import { decodeOfxBatch } from "./batch-codec";

const ERROR_MESSAGES: Record<string, string> = {
  "campos-obrigatorios": "Preencha todos os campos obrigatórios.",
  "conta-ou-responsavel-invalido": "Conta ou responsável inválido.",
  "ofx-invalido": "Não foi possível ler esse arquivo OFX.",
  "fatura-invalida": "Não foi possível interpretar o texto colado. Verifique se é um JSON válido.",
};

export default async function ImportOfxPage({
  searchParams,
}: {
  searchParams: Promise<{
    erro?: string;
    batch?: string;
    accountId?: string;
    ownerId?: string;
    tab?: string;
  }>;
}) {
  const { erro, batch, accountId, ownerId, tab } = await searchParams;
  const activeTab = tab === "fatura" ? "fatura" : "ofx";
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
        <h1 className="text-xl font-semibold">Importar transações</h1>

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
      <h1 className="text-xl font-semibold">Importar transações</h1>

      {errorMessage && (
        <p className="text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      )}

      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
        <a
          href="/dashboard/transactions/import?tab=ofx"
          className={`px-3 py-2 text-sm font-medium ${
            activeTab === "ofx"
              ? "border-b-2 border-primary text-foreground"
              : "text-zinc-500 hover:text-foreground"
          }`}
        >
          Extrato bancário
        </a>
        <a
          href="/dashboard/transactions/import?tab=fatura"
          className={`px-3 py-2 text-sm font-medium ${
            activeTab === "fatura"
              ? "border-b-2 border-primary text-foreground"
              : "text-zinc-500 hover:text-foreground"
          }`}
        >
          Fatura do cartão
        </a>
      </div>

      {activeTab === "ofx" ? (
        <Card>
          <CardHeader>
            <CardTitle>Selecionar arquivo</CardTitle>
          </CardHeader>
          <CardContent>
            <OfxUploadForm action={uploadOfxAction} accounts={accounts} members={household.members} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Colar fatura</CardTitle>
          </CardHeader>
          <CardContent>
            <CardBillPasteForm
              action={pasteCardBillAction}
              accounts={accounts}
              members={household.members}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

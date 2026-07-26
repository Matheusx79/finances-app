import Link from "next/link";
import { requireHousehold } from "@/lib/current-household";
import { listAccounts } from "@/domain/accounts/list-accounts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createAccountAction, deleteAccountAction, renameAccountAction } from "./actions";

export default async function AccountsPage() {
  const { supabase, householdId } = await requireHousehold();
  const accounts = await listAccounts(supabase, { householdId });

  return (
    <div className="flex min-h-screen flex-col items-center gap-4 bg-zinc-50 p-4 dark:bg-black">
      <div className="flex w-full max-w-sm flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Contas</h1>
          <Button render={<Link href="/dashboard">Voltar</Link>} variant="outline" size="sm" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Nova conta</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createAccountAction} className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" name="name" placeholder="Ex.: Conta Corrente" required />
              </div>
              <Button type="submit">Adicionar</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Suas contas</CardTitle>
          </CardHeader>
          <CardContent>
            {accounts.length === 0 ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Nenhuma conta cadastrada ainda.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {accounts.map((account) => (
                  <li
                    key={account.id}
                    className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <form action={renameAccountAction} className="flex flex-1 gap-2">
                      <input type="hidden" name="accountId" value={account.id} />
                      <Input
                        name="name"
                        defaultValue={account.name}
                        aria-label={`Nome da conta ${account.name}`}
                        required
                      />
                      <Button type="submit" variant="outline" size="sm">
                        Salvar
                      </Button>
                    </form>
                    <form action={deleteAccountAction}>
                      <input type="hidden" name="accountId" value={account.id} />
                      <Button type="submit" variant="destructive" size="sm">
                        Excluir
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

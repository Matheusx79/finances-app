import { requireHousehold } from "@/lib/current-household";
import { listAccounts } from "@/domain/accounts/list-accounts";
import { getAccountBalances } from "@/domain/accounts/get-account-balances";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createAccountAction } from "./actions";
import { AccountRow } from "./account-row";

export default async function AccountsPage() {
  const { supabase, householdId } = await requireHousehold();
  const [accounts, balances] = await Promise.all([
    listAccounts(supabase, { householdId }),
    getAccountBalances(supabase, { householdId }),
  ]);

  return (
    <div className="flex w-full max-w-sm flex-col gap-4 lg:max-w-5xl">
      <h1 className="font-heading text-2xl font-medium">Contas</h1>

      <Card className="lg:max-w-sm">
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
            <p className="text-sm text-muted-foreground">Nenhuma conta cadastrada ainda.</p>
          ) : (
            <ul className="flex flex-col gap-2 lg:grid lg:grid-cols-2 xl:grid-cols-3">
              {accounts.map((account) => (
                <AccountRow
                  key={account.id}
                  account={account}
                  balance={balances.get(account.id) ?? 0}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

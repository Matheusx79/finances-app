import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getHouseholdForUser } from "@/domain/household/get-household-for-user";
import { Button } from "@/components/ui/button";
import { logout } from "./actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const household = await getHouseholdForUser(supabase, { userId: user.id });
  const displayName =
    household?.members.find((member) => member.userId === user.id)?.displayName ?? user.email;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 p-4 dark:bg-black">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold">Bem-vindo, {displayName}!</h1>
        {household && (
          <p className="text-zinc-600 dark:text-zinc-400">{household.name}</p>
        )}
      </div>
      <div className="flex gap-2">
        <Button render={<Link href="/dashboard/accounts">Contas</Link>} variant="outline" />
        <form action={logout}>
          <Button type="submit" variant="outline">
            Sair
          </Button>
        </form>
      </div>
    </div>
  );
}

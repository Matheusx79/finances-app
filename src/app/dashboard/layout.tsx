import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "./actions";
import { BottomNav } from "./bottom-nav";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <div className="flex justify-end p-2">
        <form action={logout}>
          <Button type="submit" variant="ghost" size="icon" aria-label="Sair">
            <LogOut />
          </Button>
        </form>
      </div>

      <main className="flex flex-1 flex-col items-center gap-4 px-4 pb-24">{children}</main>

      <BottomNav />
    </div>
  );
}

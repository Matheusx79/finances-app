import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "./actions";
import { BottomNav } from "./bottom-nav";
import { SidebarNav } from "./sidebar-nav";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SidebarNav />

      <div className="flex justify-end p-2 lg:hidden">
        <form action={logout}>
          <Button type="submit" variant="ghost" size="icon" aria-label="Sair">
            <LogOut />
          </Button>
        </form>
      </div>

      <main className="flex flex-1 flex-col items-center gap-4 px-4 pb-24 lg:items-stretch lg:pt-8 lg:pr-8 lg:pb-8 lg:pl-72">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}

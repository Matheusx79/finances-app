"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logout } from "./actions";
import { NAV_DESTINATIONS } from "./nav-links";

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Navegação principal"
      className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar p-4 lg:flex"
    >
      <p className="px-2 pb-4 text-lg font-semibold text-sidebar-foreground">Finanças</p>

      <ul className="flex flex-1 flex-col gap-1">
        {NAV_DESTINATIONS.map(({ href, label, icon: Icon, exact }) => {
          const isActive: boolean = exact
            ? pathname === href
            : pathname === href || (pathname?.startsWith(`${href}/`) ?? false);

          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium text-sidebar-foreground",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "hover:bg-sidebar-accent/50",
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>

      <form action={logout}>
        <Button
          type="submit"
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground"
        >
          <LogOut className="size-4" />
          Sair
        </Button>
      </form>
    </aside>
  );
}

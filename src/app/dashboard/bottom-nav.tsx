"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, Home, PiggyBank, Repeat, Tags, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const DESTINATIONS = [
  { href: "/dashboard", label: "Início", icon: Home, exact: true },
  { href: "/dashboard/transactions", label: "Transações", icon: ArrowLeftRight, exact: false },
  { href: "/dashboard/accounts", label: "Contas", icon: Wallet, exact: false },
  { href: "/dashboard/categories", label: "Categorias", icon: Tags, exact: false },
  { href: "/dashboard/budgets", label: "Orçamentos", icon: PiggyBank, exact: false },
  { href: "/dashboard/recurring", label: "Recorrentes", icon: Repeat, exact: false },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-zinc-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-zinc-800 dark:bg-zinc-950"
    >
      <ul className="mx-auto flex max-w-lg">
        {DESTINATIONS.map(({ href, label, icon: Icon, exact }) => {
          const isActive: boolean = exact
            ? pathname === href
            : pathname === href || (pathname?.startsWith(`${href}/`) ?? false);

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
                  isActive ? "text-primary" : "text-zinc-500 dark:text-zinc-400",
                )}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

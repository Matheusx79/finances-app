"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_DESTINATIONS } from "./nav-links";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto flex max-w-lg">
        {NAV_DESTINATIONS.map(({ href, label, icon: Icon, exact }) => {
          const isActive: boolean = exact
            ? pathname === href
            : pathname === href || (pathname?.startsWith(`${href}/`) ?? false);

          return (
            <li key={href} className="min-w-0 flex-1">
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" />
                <span className="text-center leading-tight break-words">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

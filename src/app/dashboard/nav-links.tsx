import { ArrowLeftRight, Home, PiggyBank, Repeat, Tag, Tags, Wallet } from "lucide-react";

export const NAV_DESTINATIONS = [
  { href: "/dashboard", label: "Início", icon: Home, exact: true },
  { href: "/dashboard/transactions", label: "Transações", icon: ArrowLeftRight, exact: false },
  { href: "/dashboard/accounts", label: "Contas", icon: Wallet, exact: false },
  { href: "/dashboard/categories", label: "Categorias", icon: Tags, exact: false },
  { href: "/dashboard/tags", label: "Etiquetas", icon: Tag, exact: false },
  { href: "/dashboard/budgets", label: "Orçamentos", icon: PiggyBank, exact: false },
  { href: "/dashboard/recurring", label: "Recorrentes", icon: Repeat, exact: false },
] as const;

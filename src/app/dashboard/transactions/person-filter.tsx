import Link from "next/link";
import { Button } from "@/components/ui/button";

export type PersonFilterValue = "casal" | "eu" | "parceiro";

/**
 * Three-way filter for the transaction feed, expressed as plain links so the
 * page stays server-rendered: switching the filter is just a navigation to
 * `?responsavel=eu|parceiro` (or no param at all for the combined/household
 * default). Shared transactions always show up regardless of which option is
 * selected — that's enforced by the domain layer, not here.
 */
export function PersonFilter({
  active,
  partnerName,
  basePath,
}: {
  active: PersonFilterValue;
  partnerName: string;
  basePath: string;
}) {
  const options: { value: PersonFilterValue; label: string; href: string }[] = [
    { value: "casal", label: "Casal", href: basePath },
    { value: "eu", label: "Eu", href: `${basePath}?responsavel=eu` },
    { value: "parceiro", label: partnerName, href: `${basePath}?responsavel=parceiro` },
  ];

  return (
    <div className="flex gap-2" role="group" aria-label="Filtrar transações por responsável">
      {options.map((option) => (
        <Button
          key={option.value}
          render={<Link href={option.href}>{option.label}</Link>}
          nativeButton={false}
          variant={active === option.value ? "default" : "outline"}
          size="sm"
        />
      ))}
    </div>
  );
}

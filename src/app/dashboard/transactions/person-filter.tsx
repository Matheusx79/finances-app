import Link from "next/link";
import { Button } from "@/components/ui/button";

export type PersonFilterValue = "casal" | "eu" | "parceiro";

function buildFilterHref(
  basePath: string,
  responsavel: "eu" | "parceiro" | undefined,
  extraParams?: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams();
  if (responsavel) params.set("responsavel", responsavel);
  if (extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
      if (value) params.set(key, value);
    }
  }
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

/**
 * Three-way filter for the transaction feed, expressed as plain links so the
 * page stays server-rendered: switching the filter is just a navigation to
 * `?responsavel=eu|parceiro` (or no param at all for the combined/household
 * default). Shared transactions always show up regardless of which option is
 * selected — that's enforced by the domain layer, not here. `extraParams`
 * lets callers preserve other filters (e.g. `ano`/`mes` from `MonthNav`) when
 * the person filter changes.
 */
export function PersonFilter({
  active,
  partnerName,
  basePath,
  extraParams,
}: {
  active: PersonFilterValue;
  partnerName: string;
  basePath: string;
  extraParams?: Record<string, string | undefined>;
}) {
  const options: { value: PersonFilterValue; label: string; href: string }[] = [
    { value: "casal", label: "Casal", href: buildFilterHref(basePath, undefined, extraParams) },
    { value: "eu", label: "Eu", href: buildFilterHref(basePath, "eu", extraParams) },
    {
      value: "parceiro",
      label: partnerName,
      href: buildFilterHref(basePath, "parceiro", extraParams),
    },
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

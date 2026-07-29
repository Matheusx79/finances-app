import Link from "next/link";
import { Button } from "@/components/ui/button";
import { memberAccent } from "@/lib/member-color";
import { buildFilterHref } from "@/lib/filter-href";

export type PersonFilterValue = "casal" | "eu" | "parceiro";

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
  meIndex,
  partnerIndex,
  basePath,
  extraParams,
}: {
  active: PersonFilterValue;
  partnerName: string;
  /** Position of "eu"/the partner in `household.members` (0 or 1) — drives the accent color. */
  meIndex?: 0 | 1;
  partnerIndex?: 0 | 1;
  basePath: string;
  extraParams?: Record<string, string | undefined>;
}) {
  const options: {
    value: PersonFilterValue;
    label: string;
    href: string;
    memberIndex?: 0 | 1;
  }[] = [
    {
      value: "casal",
      label: "Casal",
      href: buildFilterHref(basePath, { name: "responsavel", value: undefined }, extraParams),
    },
    {
      value: "eu",
      label: "Eu",
      href: buildFilterHref(basePath, { name: "responsavel", value: "eu" }, extraParams),
      memberIndex: meIndex,
    },
    {
      value: "parceiro",
      label: partnerName,
      href: buildFilterHref(basePath, { name: "responsavel", value: "parceiro" }, extraParams),
      memberIndex: partnerIndex,
    },
  ];

  return (
    <div className="flex gap-2" role="group" aria-label="Filtrar transações por responsável">
      {options.map((option) => {
        const isActive = active === option.value;
        const accent = option.memberIndex !== undefined ? memberAccent(option.memberIndex) : null;
        const style = accent
          ? isActive
            ? { backgroundColor: accent.color, borderColor: accent.color, color: accent.foreground }
            : { borderColor: accent.color, color: accent.color }
          : undefined;

        return (
          <Button
            key={option.value}
            render={<Link href={option.href}>{option.label}</Link>}
            nativeButton={false}
            variant={isActive ? "default" : "outline"}
            size="sm"
            style={style}
          />
        );
      })}
    </div>
  );
}

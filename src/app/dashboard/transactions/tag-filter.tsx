import Link from "next/link";
import type { Tag } from "@/domain/tags/types";
import { Button } from "@/components/ui/button";
import { buildFilterHref } from "@/lib/filter-href";

/**
 * Etiqueta filter for the transaction feed, same plain-links pattern as
 * PersonFilter: switching the filter navigates to `?etiqueta=<id>` (or no
 * param for "todas"). Renders nothing when the household has no tags yet.
 */
export function TagFilter({
  tags,
  active,
  basePath,
  extraParams,
}: {
  tags: Tag[];
  active?: string;
  basePath: string;
  extraParams?: Record<string, string | undefined>;
}) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar transações por etiqueta">
      <Button
        render={
          <Link href={buildFilterHref(basePath, { name: "etiqueta", value: undefined }, extraParams)}>
            Todas
          </Link>
        }
        nativeButton={false}
        variant={!active ? "default" : "outline"}
        size="sm"
      />
      {tags.map((tag) => (
        <Button
          key={tag.id}
          render={
            <Link href={buildFilterHref(basePath, { name: "etiqueta", value: tag.id }, extraParams)}>
              {tag.name}
            </Link>
          }
          nativeButton={false}
          variant={active === tag.id ? "default" : "outline"}
          size="sm"
        />
      ))}
    </div>
  );
}

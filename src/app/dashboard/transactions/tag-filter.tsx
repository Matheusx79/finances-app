import Link from "next/link";
import type { Tag } from "@/domain/tags/types";
import { Button } from "@/components/ui/button";

function buildFilterHref(
  basePath: string,
  tagId: string | undefined,
  extraParams?: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams();
  if (tagId) params.set("etiqueta", tagId);
  if (extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
      if (value) params.set(key, value);
    }
  }
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

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
        render={<Link href={buildFilterHref(basePath, undefined, extraParams)}>Todas</Link>}
        nativeButton={false}
        variant={!active ? "default" : "outline"}
        size="sm"
      />
      {tags.map((tag) => (
        <Button
          key={tag.id}
          render={
            <Link href={buildFilterHref(basePath, tag.id, extraParams)}>{tag.name}</Link>
          }
          nativeButton={false}
          variant={active === tag.id ? "default" : "outline"}
          size="sm"
        />
      ))}
    </div>
  );
}

export function buildFilterHref(
  basePath: string,
  param: { name: string; value: string | undefined },
  extraParams?: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams();
  if (param.value) params.set(param.name, param.value);
  if (extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
      if (value) params.set(key, value);
    }
  }
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

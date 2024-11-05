export function extractLinkSearchParams(link: string): Record<string, string> {
  return Array.from(new URL(link).searchParams.entries()).reduce(
    (acc, [k, v]) => ((acc[k] = v), acc),
    {} as Record<string, string>
  );
}

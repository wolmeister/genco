export function withQuery(endpoint: string, query?: Record<string, unknown>): string {
  const url = new URL(endpoint);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

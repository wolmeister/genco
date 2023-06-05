export function withQuery(url: string, query?: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  let isEmpty = true;

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        searchParams.set(key, String(value));
        isEmpty = false;
      }
    }
  }

  if (isEmpty) {
    return url;
  }

  return `${url}?${searchParams.toString()}`;
}

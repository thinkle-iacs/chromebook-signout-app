/**
 * Client-side cache for "name contains query" searches.
 *
 * The server matches with a case-insensitive substring search and caps
 * results at `limit`. That means if we already have a complete (untruncated)
 * result set for "smi", the results for "smith" are just a filter of it — no
 * network round-trip needed. This is what makes typing feel instant after the
 * first couple of letters.
 */
export type SearchCache<T> = {
  /** Synchronously answer from cache if possible, otherwise null. */
  peek: (query: string) => T[] | null;
  /** Answer from cache, or fetch (deduping concurrent identical requests). */
  search: (query: string) => Promise<T[]>;
};

export function createSearchCache<T>({
  fetchResults,
  getName,
  limit,
}: {
  fetchResults: (query: string) => Promise<T[]>;
  getName: (item: T) => string;
  /** Server-side max records; a result set this large may be truncated. */
  limit: number;
}): SearchCache<T> {
  const results = new Map<string, T[]>();
  const inFlight = new Map<string, Promise<T[]>>();
  // Must match the server's LOWER()/SEARCH() semantics exactly (no trimming).
  const normalize = (s: string) => String(s ?? "").toLowerCase();

  function peek(query: string): T[] | null {
    const q = normalize(query);
    if (results.has(q)) return results.get(q);
    for (const [key, items] of results) {
      if (key && q.includes(key) && items.length < limit) {
        const filtered = items.filter((item) =>
          normalize(getName(item)).includes(q)
        );
        results.set(q, filtered);
        return filtered;
      }
    }
    return null;
  }

  async function search(query: string): Promise<T[]> {
    const cached = peek(query);
    if (cached) return cached;
    const q = normalize(query);
    if (!inFlight.has(q)) {
      inFlight.set(
        q,
        fetchResults(query)
          .then((items) => {
            results.set(q, items);
            return items;
          })
          .finally(() => inFlight.delete(q))
      );
    }
    return inFlight.get(q);
  }

  return { peek, search };
}

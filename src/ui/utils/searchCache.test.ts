import { createSearchCache } from "./searchCache";

const PEOPLE = ["Smith, John", "Smith, Johnny", "Smithers, Ann", "Jones, Sam"];

function setup(limit = 100) {
  const fetchResults = jest.fn(async (q: string) =>
    PEOPLE.filter((n) => n.toLowerCase().includes(q.toLowerCase())).slice(
      0,
      limit
    )
  );
  const cache = createSearchCache<string>({
    fetchResults,
    getName: (n) => n,
    limit,
  });
  return { cache, fetchResults };
}

describe("createSearchCache", () => {
  it("returns null from peek before anything is fetched", () => {
    const { cache } = setup();
    expect(cache.peek("smi")).toBeNull();
  });

  it("answers longer queries locally from a complete shorter result", async () => {
    const { cache, fetchResults } = setup();
    await cache.search("smi");
    expect(cache.peek("Smith, J")).toEqual(["Smith, John", "Smith, Johnny"]);
    expect(await cache.search("smithers")).toEqual(["Smithers, Ann"]);
    expect(fetchResults).toHaveBeenCalledTimes(1);
  });

  it("matches substrings anywhere, like the server", async () => {
    const { cache } = setup();
    await cache.search("s");
    expect(cache.peek("ohn")).toBeNull(); // "s" isn't a substring of "ohn"
    expect(cache.peek("sam")).toEqual(["Jones, Sam"]);
  });

  it("does not filter locally from a possibly-truncated result", async () => {
    const { cache, fetchResults } = setup(2);
    await cache.search("s"); // hits the limit of 2
    expect(cache.peek("smithers")).toBeNull();
    await cache.search("smithers");
    expect(fetchResults).toHaveBeenCalledTimes(2);
  });

  it("dedupes concurrent identical requests", async () => {
    const { cache, fetchResults } = setup();
    await Promise.all([cache.search("Jo"), cache.search("jo")]);
    expect(fetchResults).toHaveBeenCalledTimes(1);
  });

  it("does not cache failures", async () => {
    const { cache, fetchResults } = setup();
    fetchResults.mockRejectedValueOnce(new Error("boom"));
    await expect(cache.search("jo")).rejects.toThrow("boom");
    expect(await cache.search("jo")).toEqual(["Smith, John", "Smith, Johnny", "Jones, Sam"]);
  });
});

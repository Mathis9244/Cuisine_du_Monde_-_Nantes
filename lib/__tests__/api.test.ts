import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchRestaurants, fetchCuisines } from "@/lib/api";

describe("fetchRestaurants", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it("construit l'URL avec les filtres", async () => {
    await fetchRestaurants({
      cuisine: "japanese",
      search: "sushi",
      page: 2,
      limit: 10,
      sortBy: "name",
      sortOrder: "desc",
    });

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/api/restaurants?");
    expect(url).toContain("cuisine=japanese");
    expect(url).toContain("search=sushi");
    expect(url).toContain("page=2");
    expect(url).toContain("limit=10");
    expect(url).toContain("sortBy=name");
    expect(url).toContain("sortOrder=desc");
  });

  it("lève une erreur si la réponse HTTP échoue", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "Internal error",
    });

    await expect(fetchRestaurants()).rejects.toThrow(/500/);
  });
});

describe("fetchCuisines", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ["japanese", "italian"],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it("appelle l'endpoint cuisines", async () => {
    const cuisines = await fetchCuisines();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/restaurants/cuisines",
      expect.objectContaining({ headers: { Accept: "application/json" } }),
    );
    expect(cuisines).toEqual(["japanese", "italian"]);
  });
});

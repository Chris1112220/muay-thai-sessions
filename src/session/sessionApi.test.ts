import { describe, expect, it } from "vitest";
import type { Pools, Video } from "../videos";
import { inMemoryPoolsStore } from "../pools/inMemoryPoolsStore";
import { buildSessionFromStore } from "./sessionApi";

const emptyPools = (): Pools => ({ Training: [], Fights: [], History: [] });

const video = (id: string, category: Video["category"], durationSeconds: number): Video => ({
  id,
  title: `Title ${id}`,
  channel: `Channel ${id}`,
  category,
  durationSeconds,
});

describe("buildSessionFromStore", () => {
  it("returns videos in order with length and underTarget", async () => {
    const pools = { ...emptyPools(), Training: [video("a", "Training", 170)] };
    const store = inMemoryPoolsStore(pools);

    const result = await buildSessionFromStore(
      { categories: ["Training"], budgetMinutes: 3, includeShorts: false },
      store,
      () => 0.5,
    );

    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.videos).toEqual([
      {
        id: "a",
        title: "Title a",
        channel: "Channel a",
        category: "Training",
        length: 170,
      },
    ]);
    expect(result.underTarget).toBe(false);
  });

  it("dedupes ticked categories", async () => {
    const pools = { ...emptyPools(), Training: [video("a", "Training", 170)] };
    const store = inMemoryPoolsStore(pools);

    const result = await buildSessionFromStore(
      { categories: ["Training", "Training"], budgetMinutes: 3, includeShorts: false },
      store,
      () => 0.5,
    );

    expect("error" in result).toBe(false);
  });

  it("rejects no category ticked with buildSession message", async () => {
    const store = inMemoryPoolsStore(emptyPools());

    const empty = await buildSessionFromStore(
      { categories: [], budgetMinutes: 30, includeShorts: false },
      store,
    );
    expect(empty).toEqual({ error: "Pick at least one category." });

    const invalid = await buildSessionFromStore(
      { categories: ["NotACategory"], budgetMinutes: 30, includeShorts: false },
      store,
    );
    expect(invalid).toEqual({ error: "Pick at least one category." });
  });

  it("rejects budget outside 1 to 120 whole minutes", async () => {
    const store = inMemoryPoolsStore(emptyPools());

    expect(
      await buildSessionFromStore(
        { categories: ["Training"], budgetMinutes: 0, includeShorts: false },
        store,
      ),
    ).toEqual({ error: "Pick a time budget of 1 to 120 whole minutes." });

    expect(
      await buildSessionFromStore(
        { categories: ["Training"], budgetMinutes: 121, includeShorts: false },
        store,
      ),
    ).toEqual({ error: "Pick a time budget of 1 to 120 whole minutes." });

    expect(
      await buildSessionFromStore(
        { categories: ["Training"], budgetMinutes: 10.5, includeShorts: false },
        store,
      ),
    ).toEqual({ error: "Pick a time budget of 1 to 120 whole minutes." });
  });

  it("reads pools once per request via the store", async () => {
    const store = inMemoryPoolsStore(emptyPools());
    let reads = 0;
    const counting: typeof store = {
      getPools: async () => {
        reads += 1;
        return store.getPools();
      },
    };

    await buildSessionFromStore(
      { categories: ["Training"], budgetMinutes: 5, includeShorts: false },
      counting,
      () => 0,
    );

    expect(reads).toBe(1);
  });
});
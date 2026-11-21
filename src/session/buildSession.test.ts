import { describe, expect, it } from "vitest";
import { buildSession, type Pools, type Video } from "./buildSession";

const video = (id: string, category: Video["category"], seconds: number): Video => ({
  id,
  title: `Video ${id}`,
  channel: "Some Channel",
  category,
  durationSeconds: seconds,
});

const emptyPools = (): Pools => ({ Training: [], Fights: [], History: [] });

/** Deterministic PRNG (mulberry32) so property-style tests are reproducible. */
const seeded = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const SEEDS = Array.from({ length: 200 }, (_, i) => i + 1);

const totalSeconds = (videos: Video[]) => videos.reduce((s, v) => s + v.durationSeconds, 0);

/** Pool of `count` videos with lengths cycling through the given seconds. */
const pool = (category: Video["category"], count: number, lengths: number[]): Video[] =>
  Array.from({ length: count }, (_, i) =>
    video(`${category}-${i}`, category, lengths[i % lengths.length]!),
  );

describe("buildSession", () => {
  it("builds a 3-minute session from the only video that fits", () => {
    const pools = { ...emptyPools(), Training: [video("a", "Training", 170)] };

    const session = buildSession(
      { categories: ["Training"], budgetMinutes: 3, includeShorts: false, watched: [] },
      pools,
      Math.random,
    );

    expect(session.videos.map((v) => v.id)).toEqual(["a"]);
  });

  it("never goes over the time budget", () => {
    const pools = { ...emptyPools(), Training: pool("Training", 50, [95, 140, 200, 260, 410]) };

    for (const seed of SEEDS) {
      const session = buildSession(
        { categories: ["Training"], budgetMinutes: 10, includeShorts: false, watched: [] },
        pools,
        seeded(seed),
      );
      expect(totalSeconds(session.videos)).toBeLessThanOrEqual(600);
    }
  });

  it("fills at least 85% of the time budget when the pool allows it", () => {
    const pools = { ...emptyPools(), Training: pool("Training", 50, [160, 200]) };

    for (const seed of SEEDS) {
      const session = buildSession(
        { categories: ["Training"], budgetMinutes: 10, includeShorts: false, watched: [] },
        pools,
        seeded(seed),
      );
      expect(totalSeconds(session.videos), `seed ${seed}`).toBeGreaterThanOrEqual(0.85 * 600);
    }
  });

  it("lets in a video of any length that fits the time left, such as a full fight", () => {
    const pools = { ...emptyPools(), Fights: [video("full-fight", "Fights", 560)] };

    const session = buildSession(
      { categories: ["Fights"], budgetMinutes: 10, includeShorts: false, watched: [] },
      pools,
      seeded(1),
    );

    expect(session.videos.map((v) => v.id)).toEqual(["full-fight"]);
  });

  it("counts a category ticked twice once", () => {
    const pools = { ...emptyPools(), Training: pool("Training", 50, [150]) };

    for (const seed of SEEDS) {
      const session = buildSession(
        { categories: ["Training", "Training"], budgetMinutes: 10, includeShorts: false, watched: [] },
        pools,
        seeded(seed),
      );
      const ids = session.videos.map((v) => v.id);
      expect(new Set(ids).size, `seed ${seed}: ${ids.join(",")}`).toBe(ids.length);
      expect(totalSeconds(session.videos)).toBe(600);
    }
  });

  it.each([0, -5, 121, 10.5, Number.NaN])("refuses a time budget of %s minutes", (budgetMinutes) => {
    const pools = { ...emptyPools(), Training: pool("Training", 50, [150]) };

    expect(() =>
      buildSession({ categories: ["Training"], budgetMinutes, includeShorts: false, watched: [] }, pools, seeded(1)),
    ).toThrow("Pick a time budget of 1 to 120 whole minutes.");
  });

  it.each([1, 120])("accepts a time budget of %s minutes", (budgetMinutes) => {
    const pools = { ...emptyPools(), Training: pool("Training", 150, [60]) };

    const session = buildSession(
      { categories: ["Training"], budgetMinutes, includeShorts: false, watched: [] },
      pools,
      seeded(1),
    );

    expect(totalSeconds(session.videos)).toBe(budgetMinutes * 60);
  });

  it("refuses to build a session with no category ticked", () => {
    expect(() =>
      buildSession(
        { categories: [], budgetMinutes: 10, includeShorts: false, watched: [] },
        emptyPools(),
        seeded(1),
      ),
    ).toThrow("Pick at least one category.");
  });

  it("splits the time budget evenly across the ticked categories", () => {
    const pools = {
      ...emptyPools(),
      // Training videos are short, History long: an unbalanced builder would favour one.
      Training: pool("Training", 50, [90, 120, 150]),
      History: pool("History", 50, [420, 480, 540, 600]),
    };

    for (const seed of SEEDS) {
      const session = buildSession(
        { categories: ["Training", "History"], budgetMinutes: 30, includeShorts: false, watched: [] },
        pools,
        seeded(seed),
      );
      for (const category of ["Training", "History"] as const) {
        const share = totalSeconds(session.videos.filter((v) => v.category === category));
        expect(share, `${category}, seed ${seed}`).toBeLessThanOrEqual(900);
        expect(share, `${category}, seed ${seed}`).toBeGreaterThanOrEqual(0.85 * 900);
      }
    }
  });

  it("never plays two videos from the same category in a row when it can be avoided", () => {
    // Every video is 150s and each share is 600s, so each category contributes exactly 4 videos.
    const pools: Pools = {
      Training: pool("Training", 50, [150]),
      Fights: pool("Fights", 50, [150]),
      History: pool("History", 50, [150]),
    };

    for (const seed of SEEDS) {
      const session = buildSession(
        { categories: ["Training", "Fights", "History"], budgetMinutes: 30, includeShorts: false, watched: [] },
        pools,
        seeded(seed),
      );
      const categories = session.videos.map((v) => v.category);
      expect(categories).toHaveLength(12);
      for (let i = 1; i < categories.length; i++) {
        expect(categories[i], `seed ${seed}: ${categories.join(",")}`).not.toBe(categories[i - 1]);
      }
    }
  });

  it("puts unavoidable same-category repeats at the end", () => {
    // Shares are 300s each: Training fills with 4 × 75s, History with 2 × 150s, so one repeat is unavoidable.
    const pools = {
      ...emptyPools(),
      Training: pool("Training", 50, [75]),
      History: pool("History", 50, [150]),
    };

    for (const seed of SEEDS) {
      const session = buildSession(
        { categories: ["Training", "History"], budgetMinutes: 10, includeShorts: false, watched: [] },
        pools,
        seeded(seed),
      );
      const categories = session.videos.map((v) => v.category);
      const repeats = categories.flatMap((c, i) => (i > 0 && c === categories[i - 1] ? [i] : []));
      expect(repeats, `seed ${seed}: ${categories.join(",")}`).toHaveLength(1);
      // Every repeat sits in one run of the same category that ends the session.
      const tailStart = repeats[0]! - 1;
      expect(new Set(categories.slice(tailStart)).size, `seed ${seed}: ${categories.join(",")}`).toBe(1);
    }
  });

  it("orders categories at random, not just the videos within them", () => {
    // Shares are 420s each: Training fills with 3 × 140s, Fights and History with 2 × 210s each.
    const pools: Pools = {
      Training: pool("Training", 50, [140]),
      Fights: pool("Fights", 50, [210]),
      History: pool("History", 50, [210]),
    };
    const openers = new Set<string>();

    for (const seed of SEEDS) {
      const session = buildSession(
        { categories: ["Training", "Fights", "History"], budgetMinutes: 21, includeShorts: false, watched: [] },
        pools,
        seeded(seed),
      );
      const categories = session.videos.map((v) => v.category);
      expect(categories).toHaveLength(7);
      for (let i = 1; i < categories.length; i++) {
        expect(categories[i], `seed ${seed}: ${categories.join(",")}`).not.toBe(categories[i - 1]);
      }
      openers.add(categories[0]!);
    }

    expect([...openers].sort()).toEqual(["Fights", "History", "Training"]);
  });

  it("leaves out the viewer's watched videos", () => {
    const training = pool("Training", 50, [150]);
    const pools = { ...emptyPools(), Training: training };
    const watched = training.slice(0, 40).map((v) => v.id);

    for (const seed of SEEDS) {
      const session = buildSession(
        { categories: ["Training"], budgetMinutes: 10, includeShorts: false, watched },
        pools,
        seeded(seed),
      );
      expect(session.videos).toHaveLength(4);
      for (const v of session.videos) expect(watched, `seed ${seed}`).not.toContain(v.id);
    }
  });

  it("resets a category's watched list when too few unwatched videos are left to fill its share", () => {
    const training = pool("Training", 50, [150]);
    const history = pool("History", 50, [150]);
    const pools = { ...emptyPools(), Training: training, History: history };
    // Only 2 unwatched Training videos (300s) remain for a 600s share; History has plenty.
    const watched = [...training.slice(0, 48), ...history.slice(0, 10)].map((v) => v.id);

    for (const seed of SEEDS) {
      const session = buildSession(
        { categories: ["Training", "History"], budgetMinutes: 20, includeShorts: false, watched },
        pools,
        seeded(seed),
      );
      const trainingVideos = session.videos.filter((v) => v.category === "Training");
      const historyVideos = session.videos.filter((v) => v.category === "History");

      expect(session.resetCategories).toEqual(["Training"]);
      expect(totalSeconds(trainingVideos)).toBe(600);
      expect(totalSeconds(historyVideos)).toBe(600);
      for (const v of historyVideos) expect(watched, `seed ${seed}`).not.toContain(v.id);
    }
  });

  it("resets a category's watched list when it takes a thin category's spare time and runs short", () => {
    const training = pool("Training", 50, [150]);
    const pools = {
      ...emptyPools(),
      Training: training,
      History: pool("History", 2, [150]), // only 300s for a 600s share, so Training's share grows to 900s
    };
    // 4 unwatched Training videos (600s) cover the even share but not the grown one.
    const watched = training.slice(0, 46).map((v) => v.id);

    for (const seed of SEEDS) {
      const session = buildSession(
        { categories: ["Training", "History"], budgetMinutes: 20, includeShorts: false, watched },
        pools,
        seeded(seed),
      );
      expect(session.resetCategories).toEqual(["Training"]);
      expect(totalSeconds(session.videos.filter((v) => v.category === "Training")), `seed ${seed}`).toBe(900);
    }
  });

  it("gives a thin category's unfilled time to the other ticked categories", () => {
    const pools = {
      ...emptyPools(),
      Training: pool("Training", 50, [150]),
      History: pool("History", 2, [150]), // only 300s in the whole pool, for a 600s share
    };

    for (const seed of SEEDS) {
      const session = buildSession(
        { categories: ["Training", "History"], budgetMinutes: 20, includeShorts: false, watched: [] },
        pools,
        seeded(seed),
      );
      expect(totalSeconds(session.videos.filter((v) => v.category === "History"))).toBe(300);
      expect(totalSeconds(session.videos.filter((v) => v.category === "Training"))).toBe(900);
    }
  });

  it("doesn't report a reset for a thin category with nothing watched", () => {
    const pools = { ...emptyPools(), History: pool("History", 2, [150]) };

    const session = buildSession(
      { categories: ["History"], budgetMinutes: 10, includeShorts: false, watched: [] },
      pools,
      seeded(1),
    );
    expect(session.resetCategories).toEqual([]);
  });

  it("returns the best it can and flags it when a lone ticked category can't reach 85%", () => {
    const thin = { ...emptyPools(), Training: pool("Training", 2, [150]) };
    const ample = { ...emptyPools(), Training: pool("Training", 50, [150]) };
    const request = {
      categories: ["Training" as const],
      budgetMinutes: 10,
      includeShorts: false,
      watched: [],
    };

    const short = buildSession(request, thin, seeded(1));
    expect(totalSeconds(short.videos)).toBe(300);
    expect(short.underTarget).toBe(true);

    const filled = buildSession(request, ample, seeded(1));
    expect(filled.underTarget).toBe(false);
  });

  it("leaves out Shorts unless Include Shorts is ticked", () => {
    // 45s videos are Shorts (under one minute); 60s is the shortest non-Short.
    const pools = { ...emptyPools(), Training: [...pool("Training", 10, [45]), video("full", "Training", 60)] };
    const request = { categories: ["Training" as const], budgetMinutes: 3, watched: [] };

    for (const seed of SEEDS) {
      const without = buildSession({ ...request, includeShorts: false }, pools, seeded(seed));
      expect(without.videos.map((v) => v.id)).toEqual(["full"]);

      const withShorts = buildSession({ ...request, includeShorts: true }, pools, seeded(seed));
      expect(withShorts.videos.some((v) => v.durationSeconds < 60)).toBe(true);
    }
  });
});

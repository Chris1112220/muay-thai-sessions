import { describe, expect, it } from "vitest";
import { selectPool, type Candidate } from "./selectPool";

let nextId = 0;
const candidate = (overrides: Partial<Candidate> = {}): Candidate => ({
  id: `vid-${nextId++}`,
  title: "Muay Thai video",
  channel: "Some Gym",
  channelId: "UC-some-gym",
  durationSeconds: 300,
  embeddable: true,
  ageRestricted: false,
  liveStatus: "none",
  viewCount: 25_000,
  ...overrides,
});

const noChannels = { blocked: [], trusted: [] };

describe("selectPool", () => {
  it("turns an eligible candidate into a pool video of the category", () => {
    const c = candidate({ id: "abc", title: "Teep drills", channel: "Fairtex", durationSeconds: 245 });

    expect(selectPool("Training", [c], noChannels)).toEqual([
      { id: "abc", title: "Teep drills", channel: "Fairtex", category: "Training", durationSeconds: 245 },
    ]);
  });

  it.each([
    ["embedding is not allowed", { embeddable: false }],
    ["it is age-restricted", { ageRestricted: true }],
    ["it is live", { liveStatus: "live" as const }],
    ["it is an upcoming premiere", { liveStatus: "upcoming" as const }],
    ["it has fewer than 10,000 views", { viewCount: 9_999 }],
  ])("leaves a video out when %s", (_, overrides) => {
    expect(selectPool("Fights", [candidate(overrides)], noChannels)).toEqual([]);
  });

  it("keeps a video with exactly 10,000 views", () => {
    expect(selectPool("Fights", [candidate({ viewCount: 10_000 })], noChannels)).toHaveLength(1);
  });

  it("never lets a blocked channel's videos in", () => {
    const blocked = candidate({ id: "spam", channelId: "UC-spam" });
    const fine = candidate({ id: "ok", channelId: "UC-gym" });

    const pool = selectPool("History", [blocked, fine], { blocked: ["UC-spam"], trusted: [] });

    expect(pool.map((v) => v.id)).toEqual(["ok"]);
  });

  it("keeps the 50 best-ranked eligible videos, in ranked order", () => {
    const ranked = Array.from({ length: 70 }, (_, i) => candidate({ id: `r${i}` }));

    const pool = selectPool("Training", ranked, noChannels);

    expect(pool.map((v) => v.id)).toEqual(Array.from({ length: 50 }, (_, i) => `r${i}`));
  });

  it("mixes all search phrases' results and ranks them together by all-time views", () => {
    // Results arrive phrase by phrase: the first phrase's 40 videos have fewer views than the second's 30.
    const firstPhrase = Array.from({ length: 40 }, (_, i) => candidate({ id: `a${i}`, viewCount: 20_000 + i }));
    const secondPhrase = Array.from({ length: 30 }, (_, i) => candidate({ id: `b${i}`, viewCount: 90_000 - i }));

    const pool = selectPool("Training", [...firstPhrase, ...secondPhrase], noChannels);

    expect(pool.map((v) => v.id)).toEqual([
      ...Array.from({ length: 30 }, (_, i) => `b${i}`),
      ...Array.from({ length: 20 }, (_, i) => `a${39 - i}`),
    ]);
  });

  it("always lets a trusted channel's eligible videos in, even when ranked below the cut", () => {
    const ranked = Array.from({ length: 70 }, (_, i) =>
      [60, 65].includes(i)
        ? candidate({ id: `r${i}`, channelId: "UC-trusted" })
        : i === 66
          ? candidate({ id: `r${i}`, channelId: "UC-trusted", ageRestricted: true })
          : candidate({ id: `r${i}` }),
    );

    const pool = selectPool("Fights", ranked, { blocked: [], trusted: ["UC-trusted"] });

    expect(pool.map((v) => v.id)).toEqual([
      ...Array.from({ length: 48 }, (_, i) => `r${i}`),
      "r60",
      "r65",
    ]);
  });

  it("includes a video found by several search phrases only once", () => {
    const a = candidate({ id: "a" });
    const b = candidate({ id: "b" });

    const pool = selectPool("History", [a, b, { ...a }, b], noChannels);

    expect(pool.map((v) => v.id)).toEqual(["a", "b"]);
  });
});

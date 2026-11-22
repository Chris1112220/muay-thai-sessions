import { describe, expect, it, vi } from "vitest";
import type { Candidate } from "./selectPool";
import type { Category, Pools } from "../videos";
import { inMemoryPoolsStore } from "./inMemoryPoolsStore";
import { CATEGORY_SEARCHES } from "./categorySearches";
import { refreshPools, type YouTubeClient } from "./poolRefresh";
import { authorizeCron } from "./cronAuth";
import type { ChannelConfig } from "./loadChannelConfig";

const emptyPools = (): Pools => ({ Training: [], Fights: [], History: [] });

const candidate = (id: string, views = 25_000): Candidate => ({
  id,
  title: `Title ${id}`,
  channel: `Channel ${id}`,
  channelId: `UC-${id}`,
  durationSeconds: 300,
  embeddable: true,
  ageRestricted: false,
  liveStatus: "none",
  viewCount: views,
});

const channels: ChannelConfig = { blocked: [], trusted: [] };

function fakeYouTube(
  handlers: Partial<{
    search: YouTubeClient["searchList"];
    videos: YouTubeClient["videosList"];
  }> = {},
): YouTubeClient {
  return {
    searchList: handlers.search ?? (async () => []),
    videosList: handlers.videos ?? (async (ids) => ids.map((id) => candidate(id))),
  };
}

describe("refreshPools", () => {
  it("runs one search per phrase (9 total) and writes all pools under one set", async () => {
    const searches: { query: string; relevanceLanguage?: string }[] = [];
    const youtube = fakeYouTube({
      search: async (query, options) => {
        searches.push({ query, relevanceLanguage: options.relevanceLanguage });
        return [`${query}-1`];
      },
    });
    const store = inMemoryPoolsStore(emptyPools());
    const setSpy = vi.spyOn(store, "setPools");

    await refreshPools({ store, youtube, channels, log: { error: () => {} } });

    expect(searches).toHaveLength(9);
    for (const category of Object.keys(CATEGORY_SEARCHES) as Category[]) {
      for (const phrase of CATEGORY_SEARCHES[category].phrases) {
        expect(searches.some((s) => s.query === phrase)).toBe(true);
      }
    }
    expect(setSpy).toHaveBeenCalledOnce();
  });

  it("prefers English for Training and History, not Fights", async () => {
    const searches: { query: string; relevanceLanguage?: string }[] = [];
    const youtube = fakeYouTube({
      search: async (query, options) => {
        searches.push({ query, relevanceLanguage: options.relevanceLanguage });
        return [];
      },
    });
    const store = inMemoryPoolsStore(emptyPools());

    await refreshPools({ store, youtube, channels, log: { error: () => {} } });

    const lang = (phrase: string) => searches.find((s) => s.query === phrase)?.relevanceLanguage;
    expect(lang("muay thai technique")).toBe("en");
    expect(lang("muay thai history documentary")).toBe("en");
    expect(lang("muay thai full fight")).toBeUndefined();
  });

  it("batches videos.list in groups of at most 50", async () => {
    const batchSizes: number[] = [];
    const ids = Array.from({ length: 75 }, (_, i) => `id-${i}`);
    const youtube = fakeYouTube({
      search: async (query) => (query === "muay thai technique" ? ids : []),
      videos: async (batch) => {
        batchSizes.push(batch.length);
        return batch.map((id) => candidate(id));
      },
    });
    const store = inMemoryPoolsStore(emptyPools());

    await refreshPools({ store, youtube, channels, log: { error: () => {} } });

    expect(batchSizes.filter((n) => n > 0)).toEqual([50, 25]);
  });

  it("keeps a category's old pool when YouTube fails for that category", async () => {
    const existing: Pools = {
      Training: [{ id: "old", title: "Old", channel: "C", category: "Training", durationSeconds: 100 }],
      Fights: [],
      History: [],
    };
    const store = inMemoryPoolsStore(existing);
    const errors: string[] = [];
    const youtube = fakeYouTube({
      search: async (query) => {
        if (query.startsWith("muay thai technique")) {
          throw new Error("search failed");
        }
        return ["ok-1"];
      },
    });

    await refreshPools({ store, youtube, channels, log: { error: (msg) => errors.push(msg) } });

    const pools = await store.getPools();
    expect(pools.Training).toEqual(existing.Training);
    expect(pools.Fights.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.includes("Training"))).toBe(true);
  });
});

describe("authorizeCron", () => {
  it("accepts Bearer CRON_SECRET and rejects others", () => {
    expect(
      authorizeCron(new Request("http://x", { headers: { Authorization: "Bearer secret-1" } }), "secret-1"),
    ).toBe(true);
    expect(
      authorizeCron(new Request("http://x", { headers: { Authorization: "Bearer wrong" } }), "secret-1"),
    ).toBe(false);
    expect(authorizeCron(new Request("http://x"), "secret-1")).toBe(false);
    expect(
      authorizeCron(new Request("http://x", { headers: { Authorization: "Bearer secret-1" } }), undefined),
    ).toBe(false);
  });
});
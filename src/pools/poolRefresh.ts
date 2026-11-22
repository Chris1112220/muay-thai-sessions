import type { Category, Pools } from "../videos";
import { selectPool } from "./selectPool";
import type { ChannelConfig } from "./loadChannelConfig";
import { CATEGORY_SEARCHES } from "./categorySearches";
import type { PoolsStore } from "./poolsStore";
import type { Candidate } from "./selectPool";

const VIDEO_ID_BATCH = 50;

export interface YouTubeClient {
  searchList(
    query: string,
    options: { relevanceLanguage?: string; order: "viewCount" | "relevance" },
  ): Promise<string[]>;
  videosList(ids: string[]): Promise<Candidate[]>;
}

export interface RefreshLogger {
  error(message: string): void;
}

export interface RefreshDeps {
  store: PoolsStore;
  youtube: YouTubeClient;
  channels: ChannelConfig;
  log: RefreshLogger;
}

export async function refreshPools(deps: RefreshDeps): Promise<void> {
  const existing = await deps.store.getPools();
  const next: Pools = { ...existing };
  const categories = Object.keys(CATEGORY_SEARCHES) as Category[];

  for (const category of categories) {
    try {
      next[category] = await refreshCategory(category, deps);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      deps.log.error(`Pool refresh failed for ${category}: ${message}`);
    }
  }

  await deps.store.setPools(next);
}

async function refreshCategory(category: Category, deps: RefreshDeps) {
  const { phrases, relevanceLanguage } = CATEGORY_SEARCHES[category];
  const videoIds = new Set<string>();

  for (const phrase of phrases) {
    const ids = await deps.youtube.searchList(phrase, {
      relevanceLanguage,
      order: "viewCount",
    });
    for (const id of ids) {
      videoIds.add(id);
    }
  }

  const candidates: Candidate[] = [];
  const ids = [...videoIds];
  for (let i = 0; i < ids.length; i += VIDEO_ID_BATCH) {
    const batch = ids.slice(i, i + VIDEO_ID_BATCH);
    const details = await deps.youtube.videosList(batch);
    candidates.push(...details);
  }

  return selectPool(category, candidates, deps.channels);
}
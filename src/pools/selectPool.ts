import type { Category, Video } from "../videos";

/** A search result merged with its `videos.list` details. */
export interface Candidate {
  id: string;
  title: string;
  channel: string;
  channelId: string;
  durationSeconds: number;
  embeddable: boolean;
  ageRestricted: boolean;
  liveStatus: "none" | "live" | "upcoming";
  viewCount: number;
}

/** Blocked and trusted channels from the repo's config file, by channel ID. */
export interface ChannelConfig {
  blocked: string[];
  trusted: string[];
}

const MIN_VIEWS = 10_000;
export const POOL_SIZE = 50;

export function selectPool(category: Category, candidates: Candidate[], channels: ChannelConfig): Video[] {
  const blocked = new Set(channels.blocked);
  const trusted = new Set(channels.trusted);
  const seen = new Set<string>();
  const eligible = candidates
    .filter((c) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return isEligible(c) && !blocked.has(c.channelId);
    })
    // All search phrases' results are ranked together by all-time views, so no one phrase fills the pool.
    .sort((a, b) => b.viewCount - a.viewCount);

  // Trusted channels' videos always get a place; the most-viewed others fill the rest.
  const trustedCount = eligible.filter((c) => trusted.has(c.channelId)).length;
  let otherPlaces = Math.max(0, POOL_SIZE - trustedCount);
  const kept = eligible.filter((c) => trusted.has(c.channelId) || otherPlaces-- > 0);

  return kept.map((c) => ({
    id: c.id,
    title: c.title,
    channel: c.channel,
    category,
    durationSeconds: c.durationSeconds,
  }));
}

function isEligible(c: Candidate): boolean {
  return c.embeddable && !c.ageRestricted && c.liveStatus === "none" && c.viewCount >= MIN_VIEWS;
}

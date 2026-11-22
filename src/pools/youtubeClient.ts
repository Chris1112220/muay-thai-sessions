import type { Candidate } from "./selectPool";
import type { YouTubeClient } from "./poolRefresh";
import { candidateFromVideosListItem } from "./youtubeParse";

const YOUTUBE_API = "https://www.googleapis.com/youtube/v3";

interface GoogleError {
  error?: { message?: string; code?: number };
}

async function googleFetch(url: URL, apiKey: string): Promise<unknown> {
  url.searchParams.set("key", apiKey);
  const response = await fetch(url);
  const body = (await response.json()) as GoogleError & { items?: unknown[] };
  if (!response.ok) {
    const message = body.error?.message ?? `YouTube API HTTP ${response.status}`;
    const err = new Error(message);
    (err as Error & { status: number }).status = response.status;
    throw err;
  }
  return body;
}

export function createYouTubeClient(apiKey: string): YouTubeClient {
  return {
    async searchList(query, options) {
      const url = new URL(`${YOUTUBE_API}/search`);
      url.searchParams.set("part", "id");
      url.searchParams.set("type", "video");
      url.searchParams.set("maxResults", "50");
      url.searchParams.set("q", query);
      url.searchParams.set("order", options.order);
      if (options.relevanceLanguage) {
        url.searchParams.set("relevanceLanguage", options.relevanceLanguage);
      }

      const body = (await googleFetch(url, apiKey)) as { items?: { id?: { videoId?: string } }[] };
      const items = body.items ?? [];
      return items
        .map((item) => item.id?.videoId)
        .filter((id): id is string => typeof id === "string" && id.length > 0);
    },

    async videosList(ids) {
      if (ids.length === 0) {
        return [];
      }
      const url = new URL(`${YOUTUBE_API}/videos`);
      url.searchParams.set("part", "snippet,contentDetails,statistics,status,liveStreamingDetails");
      url.searchParams.set("id", ids.join(","));

      const body = (await googleFetch(url, apiKey)) as { items?: unknown[] };
      const items = body.items ?? [];
      const candidates: Candidate[] = [];
      for (const item of items) {
        const candidate = candidateFromVideosListItem(item);
        if (candidate) {
          candidates.push(candidate);
        }
      }
      return candidates;
    },
  };
}

export function youtubeClientFromEnv(): YouTubeClient {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY is not set");
  }
  return createYouTubeClient(apiKey);
}
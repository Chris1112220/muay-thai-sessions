import { buildSession } from "./buildSession";
import type { Random, SessionRequest } from "./buildSession";
import type { Category, Pools, Video } from "../videos";
import type { PoolsStore } from "../pools/poolsStore";

export const CATEGORIES: readonly Category[] = ["Training", "Fights", "History"];

export interface SessionApiBody {
  categories: unknown;
  budgetMinutes: unknown;
  includeShorts: unknown;
}

export interface SessionApiVideo {
  id: string;
  title: string;
  channel: string;
  category: Category;
  length: number;
}

export interface SessionApiSuccess {
  videos: SessionApiVideo[];
  underTarget: boolean;
}

export interface SessionApiFailure {
  error: string;
}

export type SessionApiResult = SessionApiSuccess | SessionApiFailure;

function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}

function parseRequest(body: SessionApiBody): SessionRequest {
  if (!Array.isArray(body.categories)) {
    throw new Error("Pick at least one category.");
  }
  const categories = body.categories.filter((c): c is string => typeof c === "string");
  const unique = [...new Set(categories.filter(isCategory))];
  if (unique.length === 0) {
    throw new Error("Pick at least one category.");
  }

  if (typeof body.budgetMinutes !== "number") {
    throw new Error("Pick a time budget of 1 to 120 whole minutes.");
  }

  if (typeof body.includeShorts !== "boolean") {
    throw new Error("Include Shorts must be true or false.");
  }

  return {
    categories: unique,
    budgetMinutes: body.budgetMinutes,
    includeShorts: body.includeShorts,
  };
}

function toApiVideo(video: Video): SessionApiVideo {
  return {
    id: video.id,
    title: video.title,
    channel: video.channel,
    category: video.category,
    length: video.durationSeconds,
  };
}

export async function buildSessionFromStore(
  body: SessionApiBody,
  store: PoolsStore,
  random: Random = Math.random,
): Promise<SessionApiResult> {
  let request: SessionRequest;
  try {
    request = parseRequest(body);
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }

  const pools = await store.getPools();
  try {
    const session = buildSession(request, pools, random);
    return {
      videos: session.videos.map(toApiVideo),
      underTarget: session.underTarget,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
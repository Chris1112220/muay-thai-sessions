export type Category = "Training" | "Fights" | "History";

export interface Video {
  id: string;
  title: string;
  channel: string;
  category: Category;
  durationSeconds: number;
}

export type Pools = Record<Category, Video[]>;

export interface SessionRequest {
  categories: Category[];
  budgetMinutes: number;
  includeShorts: boolean;
  watched: string[];
}

export interface Session {
  videos: Video[];
  /** Categories whose watched list was cleared because too few unwatched videos were left. */
  resetCategories: Category[];
  /** True when the session fills less than 85% of the time budget, so the viewer should be told. */
  underTarget: boolean;
}

export type Random = () => number;

const FILL_TARGET = 0.85;
const MAX_ATTEMPTS = 10;
const MIN_BUDGET_MINUTES = 1;
const MAX_BUDGET_MINUTES = 120;

export function buildSession(request: SessionRequest, pools: Pools, random: Random): Session {
  const categories = [...new Set(request.categories)];
  if (categories.length === 0) throw new Error("Pick at least one category.");
  const { budgetMinutes } = request;
  if (!Number.isInteger(budgetMinutes) || budgetMinutes < MIN_BUDGET_MINUTES || budgetMinutes > MAX_BUDGET_MINUTES) {
    throw new Error(`Pick a time budget of ${MIN_BUDGET_MINUTES} to ${MAX_BUDGET_MINUTES} whole minutes.`);
  }

  const budgetSeconds = budgetMinutes * 60;
  const shareSeconds = budgetSeconds / categories.length;
  const watched = new Set(request.watched);
  const choices = categories.map((category) => {
    const eligible = pools[category].filter((v) => request.includeShorts || !isShort(v));
    return { eligible, unwatched: eligible.filter((v) => !watched.has(v.id)) };
  });

  // Pass 1: fill each category's even share.
  const fills = choices.map((c) => fillCategory(c, shareSeconds, random));

  // Pass 2: categories that still fall short are thin; their unfilled time goes to the others.
  const isThin = fills.map((f) => total(f.videos) < FILL_TARGET * shareSeconds);
  const fullCount = isThin.filter((thin) => !thin).length;
  const spareSeconds = fills.reduce(
    (sum, f, i) => (isThin[i] ? sum + shareSeconds - total(f.videos) : sum),
    0,
  );
  const finalFills =
    spareSeconds > 0 && fullCount > 0
      ? fills.map((f, i) =>
          isThin[i] ? f : fillCategory(choices[i]!, shareSeconds + spareSeconds / fullCount, random),
        )
      : fills;

  const videos = interleave(
    finalFills.map((f) => f.videos),
    random,
  );
  return {
    videos,
    resetCategories: categories.filter((_, i) => finalFills[i]!.reset),
    underTarget: total(videos) < FILL_TARGET * budgetSeconds,
  };
}

/**
 * Fills one category's share from its unwatched videos. If they can't fill it and some videos were
 * left out as watched, the category's watched list is reset and the share is filled from all of them.
 */
function fillCategory(
  choice: { eligible: Video[]; unwatched: Video[] },
  shareSeconds: number,
  random: Random,
): { videos: Video[]; reset: boolean } {
  const fromUnwatched = fillShare(choice.unwatched, shareSeconds, random);
  if (total(fromUnwatched) >= FILL_TARGET * shareSeconds || choice.unwatched.length === choice.eligible.length) {
    return { videos: fromUnwatched, reset: false };
  }
  return { videos: fillShare(choice.eligible, shareSeconds, random), reset: true };
}

/**
 * Orders the picks at random so no two neighbours share a category where avoidable. Each step picks
 * at random among the categories that still leave a repeat-free order for the rest. When no such
 * order exists, it takes from the category with the most videos left, so the unavoidable repeats
 * fall at the end.
 */
function interleave(groups: Video[][], random: Random): Video[] {
  const remaining = groups.map((g) => [...g]);
  const out: Video[] = [];
  let last = -1;
  while (remaining.some((g) => g.length > 0)) {
    const counts = remaining.map((g) => g.length);
    const open = counts.map((_, i) => i).filter((i) => counts[i]! > 0);
    const allowed = open.length > 1 ? open.filter((i) => i !== last) : open;
    const safe = allowed.filter((i) => leavesRepeatFreeOrder(counts, i));
    if (safe.length > 0) {
      last = shuffle(safe, random)[0]!;
    } else {
      const most = Math.max(...allowed.map((i) => counts[i]!));
      last = shuffle(allowed.filter((i) => counts[i] === most), random)[0]!;
    }
    out.push(remaining[last]!.shift()!);
  }
  return out;
}

/**
 * Whether, after playing one video from category `next`, the rest can still be ordered with no two
 * neighbours from the same category. The rest mustn't start with `next`, so each of its videos needs
 * a different-category video before it; any other category needs one between each pair.
 */
function leavesRepeatFreeOrder(counts: number[], next: number): boolean {
  const after = counts.map((n, i) => (i === next ? n - 1 : n));
  const left = after.reduce((sum, n) => sum + n, 0);
  return after.every((n, i) => (i === next ? n <= left - n : n <= left - n + 1));
}

/** Best of a few random greedy fills: stops early once the fill target is met. */
function fillShare(candidates: Video[], shareSeconds: number, random: Random): Video[] {
  let best: Video[] = [];
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const videos = fillGreedily(shuffle(candidates, random), shareSeconds);
    if (total(videos) > total(best)) best = videos;
    if (total(best) >= FILL_TARGET * shareSeconds) break;
  }
  return best;
}

function fillGreedily(candidates: Video[], budgetSeconds: number): Video[] {
  const videos: Video[] = [];
  let used = 0;
  for (const v of candidates) {
    if (used + v.durationSeconds <= budgetSeconds) {
      videos.push(v);
      used += v.durationSeconds;
    }
  }
  return videos;
}

function total(videos: Video[]): number {
  return videos.reduce((sum, v) => sum + v.durationSeconds, 0);
}

function shuffle<T>(items: T[], random: Random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** A Short is a YouTube video under one minute long. */
function isShort(video: Video): boolean {
  return video.durationSeconds < 60;
}

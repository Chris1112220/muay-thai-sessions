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
/** From this budget up, no video may exceed a third of the budget, so sessions hold several videos. */
const SEVERAL_VIDEOS_FROM_MINUTES = 5;

export function buildSession(request: SessionRequest, pools: Pools, random: Random): Session {
  const budgetSeconds = request.budgetMinutes * 60;
  const maxVideoSeconds =
    request.budgetMinutes >= SEVERAL_VIDEOS_FROM_MINUTES ? budgetSeconds / 3 : budgetSeconds;
  const shareSeconds = budgetSeconds / request.categories.length;
  const watched = new Set(request.watched);
  const resetCategories: Category[] = [];

  // Pass 1: fill each category's even share, resetting its watched list if it runs short.
  const fills = request.categories.map((category) => {
    const eligible = pools[category].filter(
      (v) => v.durationSeconds <= maxVideoSeconds && (request.includeShorts || !isShort(v)),
    );
    const unwatched = eligible.filter((v) => !watched.has(v.id));
    const fromUnwatched = fillShare(unwatched, shareSeconds, random);
    if (total(fromUnwatched) >= FILL_TARGET * shareSeconds || unwatched.length === eligible.length) {
      return { candidates: unwatched, videos: fromUnwatched };
    }
    resetCategories.push(category);
    return { candidates: eligible, videos: fillShare(eligible, shareSeconds, random) };
  });

  // Pass 2: categories that still fall short are thin; their unfilled time goes to the others.
  const isThin = fills.map((f) => total(f.videos) < FILL_TARGET * shareSeconds);
  const fullCount = isThin.filter((thin) => !thin).length;
  const spareSeconds = fills.reduce(
    (sum, f, i) => (isThin[i] ? sum + shareSeconds - total(f.videos) : sum),
    0,
  );
  const picks =
    spareSeconds > 0 && fullCount > 0
      ? fills.map((f, i) =>
          isThin[i] ? f.videos : fillShare(f.candidates, shareSeconds + spareSeconds / fullCount, random),
        )
      : fills.map((f) => f.videos);

  const videos = interleave(picks, random);
  return { videos, resetCategories, underTarget: total(videos) < FILL_TARGET * budgetSeconds };
}

/**
 * Orders the picks so no two neighbours share a category where avoidable: each step takes from the
 * category with the most videos left (ties broken at random), skipping the one just played unless
 * it's the only one left, so any unavoidable repeats fall at the end.
 */
function interleave(groups: Video[][], random: Random): Video[] {
  const remaining = groups.map((g) => [...g]);
  const out: Video[] = [];
  let last = -1;
  while (remaining.some((g) => g.length > 0)) {
    const open = remaining.map((_, i) => i).filter((i) => remaining[i]!.length > 0);
    const allowed = open.length > 1 ? open.filter((i) => i !== last) : open;
    const most = Math.max(...allowed.map((i) => remaining[i]!.length));
    const tied = shuffle(allowed.filter((i) => remaining[i]!.length === most), random);
    last = tied[0]!;
    out.push(remaining[last]!.shift()!);
  }
  return out;
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

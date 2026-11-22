import type { Candidate } from "./selectPool";

/** Parse ISO 8601 duration (e.g. PT1H2M3S) to seconds. */
export function parseIso8601Duration(value: string): number {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(value);
  if (!match) {
    return 0;
  }
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  return hours * 3600 + minutes * 60 + seconds;
}

type LiveStatus = Candidate["liveStatus"];

export function liveStatusFromStreaming(
  streaming: { actualStartTime?: string; actualEndTime?: string; scheduledStartTime?: string } | undefined,
): LiveStatus {
  if (!streaming) {
    return "none";
  }
  if (streaming.actualStartTime && !streaming.actualEndTime) {
    return "live";
  }
  if (streaming.scheduledStartTime && !streaming.actualStartTime) {
    return "upcoming";
  }
  return "none";
}

export function candidateFromVideosListItem(item: unknown): Candidate | null {
  if (typeof item !== "object" || item === null) {
    return null;
  }
  const record = item as Record<string, unknown>;
  const id = record.id;
  if (typeof id !== "string") {
    return null;
  }

  const snippet = record.snippet as Record<string, unknown> | undefined;
  const status = record.status as Record<string, unknown> | undefined;
  const contentDetails = record.contentDetails as Record<string, unknown> | undefined;
  const statistics = record.statistics as Record<string, unknown> | undefined;
  const liveStreamingDetails = record.liveStreamingDetails as Record<string, unknown> | undefined;

  const title = typeof snippet?.title === "string" ? snippet.title : "";
  const channel = typeof snippet?.channelTitle === "string" ? snippet.channelTitle : "";
  const channelId = typeof snippet?.channelId === "string" ? snippet.channelId : "";

  const durationRaw = typeof contentDetails?.duration === "string" ? contentDetails.duration : "PT0S";
  const contentRating = contentDetails?.contentRating as Record<string, unknown> | undefined;
  const ageRestricted = contentRating?.ytRating === "ytAgeRestricted";

  const viewCountRaw = statistics?.viewCount;
  const viewCount =
    typeof viewCountRaw === "string" ? Number.parseInt(viewCountRaw, 10) : typeof viewCountRaw === "number" ? viewCountRaw : 0;

  const embeddable = status?.embeddable !== false;

  return {
    id,
    title,
    channel,
    channelId,
    durationSeconds: parseIso8601Duration(durationRaw),
    embeddable,
    ageRestricted,
    liveStatus: liveStatusFromStreaming(liveStreamingDetails as Record<string, string> | undefined),
    viewCount: Number.isFinite(viewCount) ? viewCount : 0,
  };
}
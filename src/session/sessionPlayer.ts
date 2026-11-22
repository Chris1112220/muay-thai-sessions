import type { SessionApiVideo } from "./sessionApi";

export const WATCH_ON_YOUTUBE_LINK_LABEL =
  "Watch on YouTube (unofficial best-effort playlist)";

export function formatDurationClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function sessionTotalSeconds(videos: Pick<SessionApiVideo, "length">[]): number {
  return videos.reduce((sum, video) => sum + video.length, 0);
}

export function completedWatchSeconds(
  videos: Pick<SessionApiVideo, "length">[],
  currentIndex: number,
): number {
  return videos.slice(0, currentIndex).reduce((sum, video) => sum + video.length, 0);
}

export function watchedCounterLabel(
  watchedSeconds: number,
  totalSeconds: number,
): string {
  return `${formatDurationClock(watchedSeconds)} of ${formatDurationClock(totalSeconds)} watched`;
}

export function upNextVideos<T extends SessionApiVideo>(
  videos: T[],
  currentIndex: number,
): T[] {
  return videos.slice(currentIndex + 1);
}

export function nowPlayingLabel(video: SessionApiVideo): string {
  return `${video.title} (${formatDurationClock(video.length)}) — ${video.channel}`;
}

export function upNextItemLabel(video: SessionApiVideo): string {
  return `${video.title} — ${video.channel} (${formatDurationClock(video.length)})`;
}

export function buildWatchOnYoutubeUrl(videoIds: string[]): string {
  return `https://www.youtube.com/watch_videos?video_ids=${videoIds.join(",")}`;
}
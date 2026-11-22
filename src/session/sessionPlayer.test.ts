import { describe, expect, it } from "vitest";
import type { SessionApiVideo } from "./sessionApi";
import {
  buildWatchOnYoutubeUrl,
  completedWatchSeconds,
  formatDurationClock,
  nowPlayingLabel,
  sessionTotalSeconds,
  upNextVideos,
  upNextItemLabel,
  watchedCounterLabel,
} from "./sessionPlayer";

function video(
  id: string,
  length: number,
  title = id,
): SessionApiVideo {
  return {
    id,
    title,
    channel: "Channel",
    category: "Training",
    length,
  };
}

describe("formatDurationClock", () => {
  it("formats minutes and zero-padded seconds", () => {
    expect(formatDurationClock(0)).toBe("0:00");
    expect(formatDurationClock(30)).toBe("0:30");
    expect(formatDurationClock(750)).toBe("12:30");
    expect(formatDurationClock(1800)).toBe("30:00");
  });
});

describe("sessionTotalSeconds", () => {
  it("sums every video length in the session", () => {
    const total = sessionTotalSeconds([
      video("a", 600),
      video("b", 1200),
    ]);
    expect(total).toBe(1800);
  });
});

describe("completedWatchSeconds", () => {
  it("counts only fully finished videos before the current index", () => {
    const videos = [video("a", 600), video("b", 900), video("c", 300)];
    expect(completedWatchSeconds(videos, 0)).toBe(0);
    expect(completedWatchSeconds(videos, 1)).toBe(600);
    expect(completedWatchSeconds(videos, 2)).toBe(1500);
  });
});

describe("watchedCounterLabel", () => {
  it("matches the spec counter format", () => {
    expect(watchedCounterLabel(750, 1800)).toBe("12:30 of 30:00 watched");
  });
});

describe("upNextVideos", () => {
  it("lists remaining videos in order after the current one", () => {
    const videos = [
      video("a", 60, "First"),
      video("b", 120, "Second"),
      video("c", 90, "Third"),
    ];
    expect(upNextVideos(videos, 0).map((v) => v.title)).toEqual([
      "Second",
      "Third",
    ]);
    expect(upNextVideos(videos, 1).map((v) => v.title)).toEqual(["Third"]);
    expect(upNextVideos(videos, 2)).toEqual([]);
  });
});

describe("nowPlayingLabel", () => {
  it("includes title, duration, and channel name", () => {
    expect(nowPlayingLabel(video("a", 750, "Roundwork drills"))).toBe(
      "Roundwork drills (12:30) — Channel",
    );
  });
});

describe("upNextItemLabel", () => {
  it("includes title, channel name, and duration", () => {
    expect(upNextItemLabel(video("b", 90, "Clinch basics"))).toBe(
      "Clinch basics — Channel (1:30)",
    );
  });
});

describe("buildWatchOnYoutubeUrl", () => {
  it("builds the undocumented watch_videos playlist URL", () => {
    expect(buildWatchOnYoutubeUrl(["abc", "def"])).toBe(
      "https://www.youtube.com/watch_videos?video_ids=abc,def",
    );
  });
});
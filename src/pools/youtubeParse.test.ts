import { describe, expect, it } from "vitest";
import { candidateFromVideosListItem, parseIso8601Duration } from "./youtubeParse";

describe("parseIso8601Duration", () => {
  it("parses hours, minutes, and seconds", () => {
    expect(parseIso8601Duration("PT1H2M3S")).toBe(3723);
    expect(parseIso8601Duration("PT45S")).toBe(45);
  });
});

describe("candidateFromVideosListItem", () => {
  it("maps a videos.list item to a Candidate", () => {
    const item = {
      id: "abc",
      snippet: { title: "Fight", channelTitle: "Lumpinee", channelId: "UC-lump" },
      contentDetails: { duration: "PT5M30S" },
      statistics: { viewCount: "12000" },
      status: { embeddable: true },
    };

    expect(candidateFromVideosListItem(item)).toEqual({
      id: "abc",
      title: "Fight",
      channel: "Lumpinee",
      channelId: "UC-lump",
      durationSeconds: 330,
      embeddable: true,
      ageRestricted: false,
      liveStatus: "none",
      viewCount: 12000,
    });
  });
});
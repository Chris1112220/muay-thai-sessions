import { mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { loadChannelConfig, parseChannelConfig } from "./loadChannelConfig";

describe("parseChannelConfig", () => {
  it("accepts empty blocked and trusted lists", () => {
    expect(parseChannelConfig({ blocked: [], trusted: [] })).toEqual({
      blocked: [],
      trusted: [],
    });
  });

  it("returns blocked and trusted channel IDs", () => {
    expect(
      parseChannelConfig({
        blocked: ["UC-blocked"],
        trusted: ["UC-trusted"],
      }),
    ).toEqual({
      blocked: ["UC-blocked"],
      trusted: ["UC-trusted"],
    });
  });

  it("reports a channel listed as both blocked and trusted", () => {
    expect(() =>
      parseChannelConfig({
        blocked: ["UC-both", "UC-only-blocked"],
        trusted: ["UC-both", "UC-only-trusted"],
      }),
    ).toThrow(/UC-both/);
  });
});

describe("loadChannelConfig", () => {
  it("loads ChannelConfig from a JSON file on disk", () => {
    const dir = mkdtempSync(join(tmpdir(), "channel-config-"));
    const path = join(dir, "channels.json");
    writeFileSync(
      path,
      JSON.stringify({ blocked: ["UC-spam"], trusted: ["UC-gym"] }),
    );

    expect(loadChannelConfig(path)).toEqual({
      blocked: ["UC-spam"],
      trusted: ["UC-gym"],
    });
  });

  it("loads the repo config file with empty lists", () => {
    expect(loadChannelConfig()).toEqual({ blocked: [], trusted: [] });
  });
});
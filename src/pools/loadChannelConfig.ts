import { readFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";

/** Blocked and trusted channels from the repo's config file, by channel ID. */
export interface ChannelConfig {
  blocked: string[];
  trusted: string[];
}

export const DEFAULT_CHANNEL_CONFIG_PATH = "config/channels.json";

function parseChannelIdList(value: unknown, field: "blocked" | "trusted"): string[] {
  if (!Array.isArray(value) || !value.every((id) => typeof id === "string")) {
    throw new Error(`Channel config ${field} must be an array of channel IDs`);
  }
  return value;
}

export function parseChannelConfig(raw: unknown): ChannelConfig {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error("Channel config must be a JSON object with blocked and trusted arrays");
  }

  const { blocked, trusted } = raw as Record<string, unknown>;
  const blockedIds = parseChannelIdList(blocked, "blocked");
  const trustedIds = parseChannelIdList(trusted, "trusted");

  const blockedSet = new Set(blockedIds);
  const overlap = trustedIds.filter((id) => blockedSet.has(id));
  if (overlap.length > 0) {
    throw new Error(
      `Channel listed as both blocked and trusted: ${overlap.join(", ")}`,
    );
  }

  return { blocked: blockedIds, trusted: trustedIds };
}

export function loadChannelConfig(path = DEFAULT_CHANNEL_CONFIG_PATH): ChannelConfig {
  const file = isAbsolute(path) ? path : join(process.cwd(), path);
  const text = readFileSync(file, "utf8");
  return parseChannelConfig(JSON.parse(text));
}
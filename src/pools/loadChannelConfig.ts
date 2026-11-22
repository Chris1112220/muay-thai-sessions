import { readFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import type { ChannelConfig } from "./selectPool";

export const DEFAULT_CHANNEL_CONFIG_PATH = "config/channels.json";

export function parseChannelConfig(raw: unknown): ChannelConfig {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Channel config must be a JSON object with blocked and trusted arrays");
  }
  const { blocked, trusted } = raw as Record<string, unknown>;
  if (!Array.isArray(blocked) || !blocked.every((id) => typeof id === "string")) {
    throw new Error("Channel config blocked must be an array of channel IDs");
  }
  if (!Array.isArray(trusted) || !trusted.every((id) => typeof id === "string")) {
    throw new Error("Channel config trusted must be an array of channel IDs");
  }

  const blockedSet = new Set(blocked);
  const overlap = trusted.filter((id) => blockedSet.has(id));
  if (overlap.length > 0) {
    throw new Error(
      `Channel listed as both blocked and trusted: ${overlap.join(", ")}`,
    );
  }

  return { blocked, trusted };
}

export function loadChannelConfig(path = DEFAULT_CHANNEL_CONFIG_PATH): ChannelConfig {
  const file = isAbsolute(path) ? path : join(process.cwd(), path);
  const text = readFileSync(file, "utf8");
  return parseChannelConfig(JSON.parse(text));
}
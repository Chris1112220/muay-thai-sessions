import { NextResponse } from "next/server";
import { authorizeCron } from "../../../../src/pools/cronAuth";
import { loadChannelConfig } from "../../../../src/pools/loadChannelConfig";
import { refreshPools } from "../../../../src/pools/poolRefresh";
import { poolsStoreFromEnv } from "../../../../src/pools/upstashPoolsStore";
import { youtubeClientFromEnv } from "../../../../src/pools/youtubeClient";

export async function GET(request: Request): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET;
  if (!authorizeCron(request, cronSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await refreshPools({
      store: poolsStoreFromEnv(),
      youtube: youtubeClientFromEnv(),
      channels: loadChannelConfig(),
      log: console,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`Pool refresh job failed: ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
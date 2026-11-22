import { NextResponse } from "next/server";
import { poolsStoreFromEnv } from "../../../src/pools/upstashPoolsStore";
import { buildSessionFromStore, type SessionApiBody } from "../../../src/session/sessionApi";

export async function POST(request: Request): Promise<NextResponse> {
  let body: SessionApiBody;
  try {
    body = (await request.json()) as SessionApiBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const result = await buildSessionFromStore(body, poolsStoreFromEnv());
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
# 01: Verify the facts the build depends on

Status: ready-for-agent
Spec: `../spec.md`, "Facts to verify before building"

## What

Check four facts against official sources before the refresh job and hosting are built, and record the answers here.

## Acceptance criteria

- [x] The maximum number of IDs per `videos.list` call, with a link to the official YouTube Data API docs.
- [x] The Vercel Hobby plan's current limits on scheduled jobs (how often, how many) and on the free key-value store (requests, storage), with links.
- [x] Whether `luckymuaythai.vercel.app` is free to claim. If an agent can't tell without an account, say so and leave it for ticket 04.
- [x] Whether `https://www.youtube.com/watch_videos?video_ids=<id>,<id>` still opens the videos in order.
- [x] If any answer contradicts the spec or ADR 0004, note the conflict for the maintainer instead of changing them.

## Answer

Full findings, with a source for each claim: `../research/01-verify-facts.md` (checked 2026-11-21).

- **`videos.list` IDs per call:** no maximum is documented. Use 50 as a working assumption and handle a 400 error. Each call costs 1 unit from the 10,000-unit daily pool.
- **`search.list` quota:** its own bucket, 100 calls a day at 1 unit each (YouTube changed this on June 1, 2026). The spec's "about 9 a day out of the 100 allowed" holds. Failed calls still count.
- **Vercel Hobby scheduled jobs:** Cron Jobs run at most once a day and fire anywhere within the scheduled hour. Functions get up to 300 s. Cron Jobs are marked legacy and are moving to Schedules (beta), which allows a run every 15 minutes on Hobby.
- **Key-value store:** Vercel KV no longer exists. Upstash Redis through the Vercel Marketplace is the option. Its free tier gives 500K commands a month, 256 MB and 10 GB of bandwidth.
- **`luckymuaythai.vercel.app`:** returns `DEPLOYMENT_NOT_FOUND`, so it's probably unused, but only creating the project confirms it (ticket 04). Vercel's docs only promise `<project>-<scope>.vercel.app`.
- **`watch_videos?video_ids=`:** still works in a fetch test. It redirects to a temporary list with the videos in the given order. It's unofficial and wasn't tested in a browser.

## Comments

**2026-11-21:** Conflicts noted for the maintainer, not yet applied:

1. ADR 0004 says scheduled jobs run "roughly once a day". It's exactly once a day, within the hour, and Cron Jobs are being replaced by Schedules.
2. ADR 0004 and the spec name Upstash Redis "such as". It's now the only Marketplace option, and its 500K commands a month means each session request should read the pools in one command.
3. Ticket 06's batch size should be 50, as an assumption, with a 400 handled.
4. The spec's address is still unconfirmed (ticket 04).

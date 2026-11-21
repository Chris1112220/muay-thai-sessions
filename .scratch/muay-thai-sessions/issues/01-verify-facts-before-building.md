# 01: Verify the facts the build depends on

Status: ready-for-agent
Spec: `../spec.md`, "Facts to verify before building"

## What

Check four facts against official sources before the refresh job and hosting are built, and record the answers here.

## Acceptance criteria

- [ ] The maximum number of IDs per `videos.list` call, with a link to the official YouTube Data API docs.
- [ ] The Vercel Hobby plan's current limits on scheduled jobs (how often, how many) and on the free key-value store (requests, storage), with links.
- [ ] Whether `luckymuaythai.vercel.app` is free to claim. If an agent can't tell without an account, say so and leave it for ticket 04.
- [ ] Whether `https://www.youtube.com/watch_videos?video_ids=<id>,<id>` still opens the videos in order.
- [ ] If any answer contradicts the spec or ADR 0004, note the conflict for the maintainer instead of changing them.

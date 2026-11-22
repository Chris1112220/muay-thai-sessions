# 06: Daily pool refresh job

Status: ready-for-agent
Blocked by: 01, 04, 05
Spec: `../spec.md`, "Pools"; ADR 0001, ADR 0004

## What

A Vercel scheduled job that runs once a day, rebuilds each category's pool from YouTube, and overwrites it in the key-value store.

## Acceptance criteria

- [ ] For each category, it runs `search.list` once per search phrase in the spec, ranked by relevance or view count, not date.
- [ ] Training and History searches prefer English; Fights has no language preference.
- [ ] It fetches details with `videos.list` in batches of at most 50 IDs, and turns each result into a `Candidate`. Google documents no maximum (ticket 01), so 50 is an assumption: a 400 response fails that category safely rather than crashing the job.
- [ ] It builds each pool with `selectPool` and the channel config from ticket 05, then writes all pools to the store together under one key, so the session API can read them in one command.
- [ ] It uses about 9 `search.list` calls a day in total.
- [ ] If YouTube fails for a category, that category's old pool is left in place and the error is logged.
- [ ] The YouTube calls and the store sit behind small interfaces, so the job is tested with fakes and no network.

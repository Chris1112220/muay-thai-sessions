# 06: Daily pool refresh job

Status: ready-for-agent
Blocked by: 01, 04, 05
Spec: `../spec.md`, "Pools"; ADR 0001, ADR 0004

## What

A Vercel scheduled job that runs once a day, rebuilds each category's pool from YouTube, and overwrites it in the key-value store.

## Acceptance criteria

- [ ] For each category, it runs `search.list` once per search phrase in the spec, ranked by relevance or view count, not date.
- [ ] Training and History searches prefer English; Fights has no language preference.
- [ ] It fetches details with `videos.list` in batches no bigger than the limit found in ticket 01, and turns each result into a `Candidate`.
- [ ] It builds each pool with `selectPool` and the channel config from ticket 05, then overwrites that category's pool in the store.
- [ ] It uses about 9 `search.list` calls a day in total.
- [ ] If YouTube fails for a category, that category's old pool is left in place and the error is logged.
- [ ] The YouTube calls and the store sit behind small interfaces, so the job is tested with fakes and no network.

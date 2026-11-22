# 04: Set up Vercel, the key-value store and the YouTube API key

Status: ready-for-human
Blocked by: 01, 03
Spec: `../spec.md`, "Stack", "Pools" (quota, storage); ADR 0004

## What

The account steps an agent can't do: link the repo to Vercel, add a free key-value store, and create a YouTube Data API key. Everything stays on free plans ($0 budget).

## Acceptance criteria

- [ ] A Vercel project on the Hobby plan is linked to the `muay-thai-sessions` GitHub repo, and the app shell from ticket 03 deploys.
- [x] The project uses `luckymuaythai.vercel.app`, or the spec is updated with the address actually used.
- [x] A free key-value store (such as Upstash Redis through the Vercel Marketplace) is connected, and its environment variables are set in Vercel.
- [x] A YouTube Data API key exists in a Google Cloud project, is restricted to the YouTube Data API, and is set as a Vercel environment variable.
- [x] The names of the environment variables (not their values) are recorded here for tickets 06 and 07.

## Environment variables

Set on the Vercel project `luckymuaythai`. All are marked sensitive.

| Name | Environments | Used by |
|---|---|---|
| `YOUTUBE_API_KEY` | production, preview, development | 06 (pool refresh) |
| `KV_REST_API_URL` | production, preview | 06, 07: the Upstash REST endpoint |
| `KV_REST_API_TOKEN` | production, preview | 06, 07: `Redis.fromEnv()` in `@upstash/redis` falls back to this and `KV_REST_API_URL` when the `UPSTASH_REDIS_*` names are unset |
| `KV_REST_API_READ_ONLY_TOKEN` | production, preview | Not used yet. 07 only reads, so it could switch to this token to rule out accidental writes |
| `KV_URL`, `REDIS_URL` | production, preview | Not needed: these are TCP connection strings, and the REST variables above suit serverless functions |

The store variables were added by the Upstash Marketplace integration and are not set for `development`, so `vercel env pull` will not bring them down for local work. Tests should not need them.

## Comments

**2026-11-22:** Checked in Vercel: project `luckymuaythai` is linked to `Chris1112220/muay-thai-sessions`, the domain `luckymuaythai.vercel.app` is verified, and the variables above exist. The only production deployment is `main` at `845e9b4`, which predates the app shell (ticket 03 is on `verify-facts`). The first box gets ticked once that branch is merged to `main` and the deploy succeeds. Plan and key restriction were taken on the maintainer's word.

# 04: Set up Vercel, the key-value store and the YouTube API key

Status: ready-for-human
Blocked by: 01, 03
Spec: `../spec.md`, "Stack", "Pools" (quota, storage); ADR 0004

## What

The account steps an agent can't do: link the repo to Vercel, add a free key-value store, and create a YouTube Data API key. Everything stays on free plans ($0 budget).

## Acceptance criteria

- [ ] A Vercel project on the Hobby plan is linked to the `muay-thai-sessions` GitHub repo, and the app shell from ticket 03 deploys.
- [ ] The project uses `luckymuaythai.vercel.app`, or the spec is updated with the address actually used.
- [ ] A free key-value store (such as Upstash Redis through the Vercel Marketplace) is connected, and its environment variables are set in Vercel.
- [ ] A YouTube Data API key exists in a Google Cloud project, is restricted to the YouTube Data API, and is set as a Vercel environment variable.
- [ ] The names of the environment variables (not their values) are recorded here for tickets 06 and 07.

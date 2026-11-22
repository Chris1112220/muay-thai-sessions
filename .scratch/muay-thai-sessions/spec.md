# Spec: Chok Dee Muay Thai v1

Status: needs-triage

A free public website that builds a Muay Thai **session** from YouTube videos to fit the **time budget** a **viewer** picks. Terms follow `GLOSSARY.md`. Decisions are recorded in `docs/adr/0001`–`0004`.

- **Name:** Chok Dee Muay Thai, shown as "Chok Dee Muay Thai" with "โชคดี มวยไทย" underneath
- **Repo:** `muay-thai-sessions`
- **URL:** `luckymuaythai.vercel.app` (availability unchecked)
- **Budget:** $0

## Viewer flow

1. The viewer ticks one or more **categories**: Training, Fights, History. With none ticked, the site doesn't build a session and asks the viewer to pick at least one category. A category ticked twice counts once.
2. The viewer sets a **time budget** of 1 to 120 whole minutes, typed in or chosen with a slider. The page keeps the input in that range, and the server refuses any budget outside it.
3. Optionally, the viewer ticks **Include Shorts**. It's off by default.
4. The site builds a session and starts playing it.

## Session building rules

- **Never over budget.** The total length is at most the time budget.
- **At least ~85% filled.** If a random attempt falls short, reshuffle and retry a few times, then use the closest result that doesn't go over.
- **Any video that fits.** There's no cap on a single video's length: any video that fits the time left can go in, so full fights are included. How many videos a session holds follows from the time budget alone.
- **Even split.** The time budget is split evenly across the ticked categories.
- **Random picks.** Videos are chosen at random from each category's **pool**.
- **Nothing remembered.** The site doesn't track or save what a viewer has watched, in the browser or on the server, so any video in a pool can come up again. Nothing about the viewer is stored on the server.
- **Ordering.** Truly random across categories, not only within them, but no two videos in a row from the same category where avoidable. Repeats are allowed at the end only when one category has more videos left than the others.
- **Thin category.** If a category can't fill its share, its unfilled time goes to the other ticked categories. If only one category is ticked, return the best session under the 85% target and tell the viewer.
- **Shorts.** They're excluded unless Include Shorts is ticked.

## Pools

- **Size and refresh.** Each category has a pool of about 50 videos, refreshed by a daily scheduled job. The job searches with a few phrases per category, then fetches details for the results.
  - Training: "muay thai technique", "muay thai drills", "muay thai beginner training"
  - Fights: "muay thai full fight", "Lumpinee fight", "Rajadamnern fight"
  - History: "muay thai history documentary", "muay boran", "legendary muay thai fighters"
- **Ranking.** All of a category's search phrases' results are mixed and ranked together by all-time views, not recency, so classic older videos stay in and the first phrase doesn't fill the pool.
- **Eligibility.** A video joins a pool only if all of these hold:
  - embedding is allowed
  - it isn't age-restricted
  - it isn't live or an upcoming premiere
  - it has at least 10,000 views
- **Language.** Training and History searches prefer English. Fights has no language preference.
- **Config file.** A config file in the repo lists **blocked channels** and **trusted channels**.
- **Quota use.** About 9 `search.list` calls a day out of the 100 allowed, plus a few `videos.list` calls from the separate 10,000-unit budget.
- **Storage.** Pools live in a free Upstash Redis database and are overwritten on each refresh, so no YouTube data is stored for more than 30 days. All pools are kept under one key, so a session request reads them with a single command (the free tier allows 500K commands a month).

## Session page

The page is a single column that works on desktop and phone.

- One embedded YouTube player that auto-advances through the session.
- An **up next** list showing every video still to play, in order, with each video's title and length, not just the next one.
- A **Skip** button.
- A counter, e.g. "12:30 of 30:00 watched".
- A "Watch on YouTube" link built with `https://www.youtube.com/watch_videos?video_ids=<id>,<id>,…`. It's unofficial and best-effort (ADR 0002).
- Unplayable or deleted videos are skipped automatically when the player reports an error.

## Compliance (YouTube API Services)

- YouTube is clearly attributed: the embedded player plus the channel names cover this.
- Link to the YouTube Terms of Service and the Google Privacy Policy, and state that using the site means agreeing to the YouTube Terms of Service.
- Don't alter the player or its ads, and don't modify the links YouTube provides.
- Don't store API data for more than 30 days (see Pools).

## Stack

- TypeScript + Next.js on Vercel's free Hobby plan.
- Upstash Redis's free tier for the pools, through the Vercel Marketplace (Vercel KV no longer exists).
- A Vercel Cron Job for the daily refresh (ADR 0004).

## Quality

- Unit tests for:
  - the time-filling rules
  - the even split
  - the ordering rule
- A GitHub Actions workflow runs the tests on every push, and the README shows its status badge.

## Tickets

The session builder (`src/session/buildSession.ts`) and pool selection (`src/pools/selectPool.ts`) are already built and tested. The rest is split into one ticket per file under `issues/`:

- `01-verify-facts-before-building.md`
- `02-ci-workflow.md`
- `03-app-shell.md`
- `04-provision-accounts-and-keys.md` (human)
- `05-channel-config-file.md`
- `06-pool-refresh-job.md`
- `07-session-api.md`
- `08-session-form.md`
- `09-session-player.md`
- `10-watched-videos.md` (wontfix: watched videos aren't tracked)
- `11-youtube-compliance.md`

## Out of scope for v1

- **"Save to my YouTube" (v2).** Google OAuth with the `youtube.force-ssl` scope. It would start unverified at $0, with a warning screen and a 100-user lifetime cap. Verification would need a domain (about $10–20 a year).
- Any-topic search, viewer accounts, and remembering what a viewer has watched.

## Facts to verify before building

Checked on 2026-11-21; see ticket 01 and `research/01-verify-facts.md`. Only the address is still open (ticket 04).

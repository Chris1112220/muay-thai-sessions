# Research: facts to verify before building (ticket 01)

| Fact | Answer | Confidence | Source |
| --- | --- | --- | --- |
| Max IDs per `videos.list` call | **Not documented.** `id` is "a comma-separated list" with no stated limit. 50 is folklore. | High that no limit is documented | [videos.list](https://developers.google.com/youtube/v3/docs/videos/list) |
| `videos.list` cost | 1 unit, from the 10,000-unit pool | High | [videos.list](https://developers.google.com/youtube/v3/docs/videos/list) |
| `search.list` cost and quota | Its own bucket: 100 calls/day, 1 unit each. **Not** 100 units/call out of 10,000. | High | [Quota costs](https://developers.google.com/youtube/v3/determine_quota_cost) |
| Vercel Hobby cron | 100 jobs/project, at most once a day, fires any time within the hour (±59 min) | High | [Cron usage & pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing) |
| Hobby function duration | 300 s default and max (Fluid compute) | High | [Functions limits](https://vercel.com/docs/functions/limitations) |
| Key-value store | Vercel KV is gone. Use Upstash Redis via Marketplace: 500K commands/month, 256 MB, 10 GB bandwidth, 1 database | High | [Redis on Vercel](https://vercel.com/docs/redis), [Upstash pricing](https://upstash.com/pricing/redis) |
| `luckymuaythai.vercel.app` | Returns 404 `DEPLOYMENT_NOT_FOUND`, so probably unused. Unconfirmed. | Low/medium | Observed fetch |
| `watch_videos?video_ids=` | Works. Redirects to `watch?v=<first>&list=TL...` with the videos in the given order | Medium (no official docs) | Observed fetch |

## 1. YouTube Data API quota

- [videos.list](https://developers.google.com/youtube/v3/docs/videos/list) says: "A call to this method has a quota cost of 1 unit." The `id` parameter is described as "a comma-separated list of the YouTube video ID(s)", with no maximum given. `maxResults` (1–50) "is not supported for use in conjunction with the `id` parameter". No primary source gives a cap. Send at most 50 IDs per call and handle a 400 error.
- [Quota costs](https://developers.google.com/youtube/v3/determine_quota_cost) says: "default quota allocation of 100 search.list calls, 100 videos.insert calls, and 10,000 units per day combined for all other endpoints… The search.list and videos.insert methods have their own quota buckets… The quota cost is 1 per call." Invalid requests still cost at least one point. Quotas reset at midnight PT. The change is dated June 1, 2026 in the [revision history](https://developers.google.com/youtube/v3/revision_history). The older figure of "100 units per search out of 10,000" no longer applies. The spec's model is current.

## 2. Vercel Hobby limits and storage

- **Cron Jobs** ([usage & pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing)): Hobby allows 100 cron jobs per project, at a minimum interval of "Once per day", with precision "Per-hour (±59 min)". Expressions that would run more than once a day fail at deploy. The same page says "Cron Jobs are a legacy feature and will be migrated to Schedules". Schedules is in beta ([limits](https://vercel.com/docs/schedules/limits)). On Hobby it allows runs at most every 15 minutes, always with a 15-minute jitter, up to 5,000 runs per billing period.
- **Duration** ([functions limits](https://vercel.com/docs/functions/limitations)): Hobby gets 300 s by default and at most 300 s. About 12 HTTP calls fit easily.
- **Storage** ([Redis on Vercel](https://vercel.com/docs/redis)): "Vercel KV is no longer available… we automatically moved it to Upstash Redis in December 2024." New projects install a Redis integration from the Marketplace. The [Upstash Free plan](https://upstash.com/pricing/redis) allows 500K commands/month with no daily cap, 250 MB storage (256 MB in the comparison table), 10 GB/month bandwidth, 1 database, 10 MB per request and 10K commands/s. Adding a credit card upgrades the account to pay-as-you-go.

## 3. `luckymuaythai.vercel.app`

`GET https://luckymuaythai.vercel.app` returned `404`, `X-Vercel-Error: DEPLOYMENT_NOT_FOUND`. No deployment answers there now. [Generated URLs](https://vercel.com/docs/deployments/generated-urls) builds names from `<project-name>`. The documented production form is `<project-name>-<scope-slug>.vercel.app`. The docs don't describe how the bare `<project-name>.vercel.app` is granted or whether names are first-come. **Only creating the project in an account confirms availability (ticket 04).**

## 4. `watch_videos?video_ids=`

No official documentation exists. I searched Google and YouTube domains. Observed results:

- `watch_videos?video_ids=dQw4w9WgXcQ,jNQXAC9IVRw` returned `303` to `watch?v=dQw4w9WgXcQ&list=TLGG…`. The page's playlist panel listed `dQw4w9WgXcQ`, then `jNQXAC9IVRw`, with `totalVideos: 2`.
- The reversed input redirected to `watch?v=jNQXAC9IVRw&list=TLGG…`, and the panel was also reversed.

I couldn't check in a browser whether playback auto-advances, whether a long list is accepted, or whether signed-in or region behaviour differs.

## Conflicts with the spec or ADR 0004

1. Spec: "It's commonly 50, but no official source confirms it." This is still true. The docs give no maximum, so treat 50 as an assumption.
2. Spec: "About 9 `search.list` calls a day out of the 100 allowed, plus a few `videos.list` calls from the separate 10,000-unit budget." Confirmed, not a conflict. Each search costs 1 call, and failed calls count too.
3. ADR 0004: "The free plan limits scheduled jobs to roughly once a day." This needs tightening. Cron Jobs run exactly once a day, at any minute within the scheduled hour. Cron Jobs are also legacy and moving to Schedules, which allows every 15 minutes on Hobby.
4. ADR 0004 and spec: "such as Upstash Redis through the Vercel Marketplace." Confirmed, and Vercel KV no longer exists. New: the cap is 500K commands/month. Every session request spends commands. One `GET` of a combined pools key keeps the cost to 1 command per session.
5. Spec: "`luckymuaythai.vercel.app` (availability unchecked)." It's still not confirmed. The docs don't promise the bare project-name address.

Checked on 2026-11-21

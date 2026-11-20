# Sessions play on the site, not as YouTube playlists

In v1, a session plays back-to-back in YouTube's embedded player on our site, with no Google sign-in, instead of creating a real playlist in the viewer's YouTube account. Creating playlists has two costs. Google sign-in for a public app needs OAuth verification: a verified domain, a privacy policy, a demo video and a review. Without verification, the app is limited to 100 sign-ins ever and shows a warning screen. The quota is also small: each saved video costs 50 of the 10,000 daily units, about 9 twenty-video playlists a day for the whole site. The project budget is $0.

## Considered Options

- **"Save to my YouTube" in v1.** Deferred to v2. It would run unverified at $0 at first. Verification costs only a domain (about $10–20 a year), and only if the polish becomes worth it.

## Consequences

A "Watch on YouTube" link opens the session as a temporary playlist using YouTube's undocumented `watch_videos?video_ids=` URL. It's best-effort and may stop working without notice.

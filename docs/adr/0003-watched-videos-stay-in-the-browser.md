# Watched videos are remembered only in the viewer's browser

**Status: superseded (2026-11-21).** Watched videos are no longer tracked at all. Sessions are plain random picks from each pool, and nothing about what a viewer has watched is saved, in the browser or on the server. The server still stores no per-viewer data.

The list of a viewer's watched videos lives in their browser's `localStorage` and is sent with each session request. The server stores no per-viewer data. This keeps the site free of accounts and sign-in. It also avoids YouTube Developer Policy duties for stored user data, such as deletion within 7 days on request.

## Consequences

Watched videos aren't shared across devices or browsers, and clearing browser data or using private browsing starts fresh. If v2 adds Google sign-in, moving this history to the server would need its own decision.

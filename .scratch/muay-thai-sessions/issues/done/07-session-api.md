# 07: Session API

Status: done
Closed: 2026-11-22
Blocked by: 03
Spec: `../spec.md`, "Viewer flow", "Session building rules"

## What

A server endpoint that takes a session request, reads the pools from the key-value store, and returns a session built by `buildSession`.

## Acceptance criteria

- [ ] It takes the ticked categories, the time budget in minutes, and Include Shorts.
- [ ] It returns the session's videos in order (ID, title, channel, category, length) and whether the session is under the 85% target.
- [ ] A request with no category ticked, or a budget outside 1 to 120 whole minutes, gets a clear error response with the message from `buildSession`.
- [ ] Nothing from the request is stored on the server.
- [ ] It reads all pools with a single store command per request, because Upstash's free tier allows 500K commands a month (ticket 01).
- [ ] The store sits behind an interface, so the endpoint is tested with an in-memory fake; ticket 04 supplies the real store.

## Comments


**2026-11-22:** POST /api/session: PoolsStore interface, in-memory tests, Upstash single GET, buildSessionFromStore

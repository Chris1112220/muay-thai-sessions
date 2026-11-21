# 10: Record watched videos in the browser

Status: ready-for-agent
Blocked by: 09
Spec: `../spec.md`, "Watched videos"; ADR 0003

## What

Remember which videos the viewer has watched, in their browser only, and send the list with each session request.

## Acceptance criteria

- [ ] A video counts as watched after 30 seconds of playback, detected through the YouTube IFrame Player API.
- [ ] Its ID is added to a list in `localStorage`, once.
- [ ] The list is sent with every session request.
- [ ] When the session API reports that a category's watched list was reset, that category's IDs are removed from the stored list.
- [ ] Nothing about the viewer is sent anywhere except in the session request.

## Notes

- The spec doesn't say how the browser knows which IDs belong to a reset category. The session's videos carry their category, but older watched IDs don't. The maintainer should decide whether to store the category with each ID.

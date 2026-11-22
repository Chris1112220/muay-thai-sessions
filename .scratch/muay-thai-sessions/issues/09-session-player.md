# 09: Session player

Status: ready-for-agent
Blocked by: 08
Spec: `../spec.md`, "Session page"; ADR 0002

## What

The part of the page that plays the session.

## Acceptance criteria

- [ ] One embedded YouTube player that moves on to the next video when one ends.
- [ ] An up next list showing every video still to play, in order, with each video's title and length.
- [ ] A Skip button.
- [ ] A counter such as "12:30 of 30:00 watched".
- [ ] A "Watch on YouTube" link built as `https://www.youtube.com/watch_videos?video_ids=<id>,<id>,…`, labelled as best-effort.
- [ ] When the player reports an error, such as a deleted or unplayable video, it skips that video automatically.
- [ ] The player and its ads aren't altered.

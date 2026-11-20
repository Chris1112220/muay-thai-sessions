# Chok Dee Muay Thai

A free public website that builds a Muay Thai watch session from YouTube videos to fit the time a viewer has.

## Language

### Sessions

**Session**:
An ordered set of YouTube videos built for one viewer to fit their time budget.
_Avoid_: Playlist (a session is not a YouTube playlist), queue, mix

**Time budget**:
The length of time the viewer chooses for a session.
_Avoid_: Duration, session length, timer

**Up next**:
The videos in the current session that haven't played yet.
_Avoid_: Queue, backlog

**Viewer**:
A person using the site. Viewers are anonymous and have no account.
_Avoid_: User, member, account

**Watched video**:
A video a viewer has played for long enough that future sessions in their browser should skip it.
_Avoid_: Seen video, viewed video, history

### Videos

**Category**:
One of three fixed kinds of Muay Thai video: Training, Fights, or History.
_Avoid_: Filter, genre, topic, mode

**Pool**:
The current set of eligible videos for one category, from which sessions are drawn.
_Avoid_: Cache, library, catalog

**Short**:
A YouTube video under one minute long. Shorts are excluded from sessions unless the viewer opts in.
_Avoid_: Clip, reel

**Blocked channel**:
A YouTube channel whose videos never enter any pool.
_Avoid_: Banned channel, blacklist

**Trusted channel**:
A YouTube channel whose eligible videos always enter its category's pool.
_Avoid_: Whitelist, featured channel

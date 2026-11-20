# Fixed categories with daily pools instead of live search

Sessions are built from three fixed Muay Thai categories (Training, Fights, History), each backed by a pool of about 50 videos refreshed once a day, instead of searching YouTube per request for any topic. Since June 2026 the YouTube Data API allows a project only 100 `search.list` calls a day, shared by every user. A public any-topic site would run out after about 100 searches. Daily pools use about 9 searches a day no matter how many viewers there are.

## Considered Options

- **Any topic, searched live, with shared results cached per topic.** This was the original idea. It was rejected because new topics stop working once the daily search quota is gone, and it makes a weaker portfolio story than a focused tool.
- **Pools of hand-picked channels only.** This gives the highest quality, but it's too much upkeep and too little variety. Instead, search phrases fill the pools, and a config file lists blocked and trusted channels.

## Consequences

Adding a category means new search phrases and roughly 3 more searches a day. Videos uploaded today reach sessions only after the next daily refresh.

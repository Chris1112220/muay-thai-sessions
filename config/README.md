# Channel config

`channels.json` lists YouTube channel IDs that pool refresh uses when building daily pools.

- **blocked** — videos from these channels never enter any pool.
- **trusted** — eligible videos from these channels always enter that category's pool.

Add IDs as JSON string entries, for example `"UCxxxxxxxxxxxxxxxxxxxxxx"`. A channel must not appear in both lists.
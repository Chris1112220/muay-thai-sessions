# 05: Blocked and trusted channels config file

Status: ready-for-agent
Spec: `../spec.md`, "Pools", "Config file"; GLOSSARY.md, "Blocked channel" and "Trusted channel"

## What

A config file in the repo that lists blocked channels and trusted channels by channel ID, loaded into the `ChannelConfig` that `selectPool` already takes.

## Acceptance criteria

- [ ] One config file in the repo, with a comment or README note on how to add a channel.
- [ ] A loader that returns `ChannelConfig` (`src/pools/selectPool.ts`), with a test.
- [ ] A channel listed as both blocked and trusted is reported as an error rather than silently picked one way.
- [ ] The lists can start empty; the maintainer fills them in.

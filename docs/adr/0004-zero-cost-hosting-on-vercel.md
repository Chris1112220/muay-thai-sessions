# $0 budget: Next.js on Vercel's free plan, with pools in a key-value store

The project is a public portfolio piece with a hard budget of $0. It runs as one TypeScript Next.js app on Vercel's free Hobby plan at a `*.vercel.app` address, with no custom domain. A daily scheduled job refreshes the pools, which are stored in a free key-value store such as Upstash Redis through the Vercel Marketplace.

## Considered Options

- **Committing the pools to the repo as JSON, refreshed by a GitHub Action.** This needs no database, which is tempting. It was rejected because YouTube's Developer Policies allow storing API data for at most 30 days, and git history keeps it forever.

## Consequences

The free plan limits scheduled jobs to roughly once a day, which matches the daily pool refresh; this should be checked against the current plan limits. Anything that adds cost, such as a domain for v2 OAuth verification, needs an explicit decision to change the $0 budget.

# 03: Next.js app shell

Status: ready-for-agent
Spec: `../spec.md`, intro, "Session page" (layout) and "Stack"

## What

Turn the repo into a TypeScript Next.js app that can run on Vercel's Hobby plan, keeping the existing logic and tests working.

## Acceptance criteria

- [ ] A Next.js app with one page that shows "Chok Dee Muay Thai" with "โชคดี มวยไทย" underneath.
- [ ] The page is a single column that works on desktop and phone.
- [ ] `src/videos.ts`, `src/session/buildSession.ts` and `src/pools/selectPool.ts` keep their tests, and `npm test` and `npm run typecheck` still pass.
- [ ] `npm run build` succeeds locally.

## Notes

- Nothing here needs accounts or keys; linking Vercel is ticket 04.

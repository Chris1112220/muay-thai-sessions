# 03: Next.js app shell

Status: done
Closed: 2026-11-21
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

## Comments


**2026-11-21:** Next.js 16 App Router shell: home page shows Chok Dee Muay Thai and Thai subtitle in a responsive single column. Added dev/build/start scripts; typecheck, Vitest, and next build pass.

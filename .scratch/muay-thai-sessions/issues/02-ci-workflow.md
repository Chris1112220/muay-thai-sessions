# 02: Run the tests on every push

Status: ready-for-agent
Spec: `../spec.md`, "Quality"

## What

A GitHub Actions workflow that runs the unit tests and the typecheck on every push, with its status badge in the README.

## Acceptance criteria

- [x] `.github/workflows/` has a workflow that runs `npm ci`, `npm run typecheck` and `npm test` on every push and pull request.
- [x] A `README.md` exists with the workflow's status badge, the product name "Chok Dee Muay Thai" and a one-line description.
- [x] The workflow passes on its own pull request.

## Comments

**2026-11-21:** Done in PR #2 (merged as 845e9b4). The "Test" workflow runs on every push and pull request, and the README shows its badge.

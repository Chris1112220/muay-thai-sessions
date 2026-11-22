# 08: Session form

Status: done
Closed: 2026-11-22
Blocked by: 07
Spec: `../spec.md`, "Viewer flow", "Thin category"

## What

The form where the viewer picks what to watch, which asks the session API for a session.

## Acceptance criteria

- [ ] Checkboxes for Training, Fights and History.
- [ ] A time budget the viewer can type or set with a slider, kept to 1 to 120 whole minutes.
- [ ] An Include Shorts checkbox, off by default.
- [ ] With no category ticked, the form doesn't send a request and asks the viewer to pick at least one category.
- [ ] When the session comes back under the 85% target, the viewer is told.
- [ ] Errors from the API are shown to the viewer.

## Comments


**2026-11-22:** Session form with category checkboxes, 1–120 min budget input/slider, Include Shorts, client validation, API errors, and under-target notice; Vitest coverage for sessionForm helpers.

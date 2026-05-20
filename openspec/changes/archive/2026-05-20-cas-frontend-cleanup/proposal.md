## Why

CAS already uses the dashboard modal as its real strategy-creation flow, but the frontend still carries an orphaned `/create` route remnant from an older design. Cleaning that up removes ambiguity without changing the live product flow.

## What Changes

- Keep the home-page strategy modal as the canonical authenticated creation flow.
- Remove the orphaned full-page create view and trim only the truly unused exports around that dead path.
- Preserve the existing `/create` compatibility redirect while making it clear that the dashboard flow owns strategy creation.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `cas-home-dashboard`: clarifies that strategy creation is owned by the home-page modal flow and that legacy `/dashboard` and `/create` entry routes redirect to `/`.

## Impact

- Affected code: `projects/cas/apps/frontend/src/app/create/`, `projects/cas/apps/frontend/src/components/`, `projects/cas/apps/frontend/src/lib/`.
- Affected systems: CAS navigation, dashboard-owned strategy creation flow, frontend dead-code surface.

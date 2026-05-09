# Changelog

## [Unreleased] - 2026-05-08
### Added
- Added `apps/backend` as a SQLite-backed Express API with health, SIWE auth, job, and execution-history routes.
- Added `apps/frontend` as a Next.js 16 local dashboard for SIWE sign-in, job creation, listing, cancellation, and execution-history inspection.
- Added `packages/shared` for CAS job request/response DTOs and an HTTP API client shared by backend and frontend.
### Changed
- Updated CAS docs for SQLite local development, Next.js 16 frontend direction, and no-ConnectKit wallet integration.
- Switched the CAS shared package back to dist exports so the Next.js frontend consumes built ESM cleanly.

## [Unreleased] - 2026-05-02
### Changed
- Updated `STRUCTURE.md` to indicate the `worker/` module migrates last and is behind a feature flag.
### Added
- Introduced `CHANGELOG.md` for the cas project.



## [Unreleased] - 2026-05-02
### Changed
- Updated `worker/` directory description in STRUCTURE.md to indicate migration is behind a feature flag and occurs last
### Added
- Added CHANGELOG.md file

## [Unreleased] - 2026-05-02
### Changed
- Updated `projects/cas/STRUCTURE.md` to indicate the `worker/` directory (Keeper) is migrated last and behind a feature flag.


All notable changes to this package are documented here.


# MINHAJ Rebuild Status

This document tracks implementation against the requested Clean Rebuild definition of done.

## Completed foundation
- React + TypeScript + Vite foundation
- Strict TypeScript and typed domain models
- Central Firebase initialization
- Repository abstraction and cursor pagination foundation
- Auth provider and admin route guard
- RTL public/admin shell
- Cloudflare Worker TypeScript entrypoint
- Gemini secret moved to Worker configuration
- Zod validation foundation
- Arabic normalization utilities
- Safe URL normalization utilities
- Typed grade converter and local task-wheel logic
- Unit tests for the above utilities
- CI lint/test/build workflow

## In progress
- Complete domain repositories and hooks
- Full Admin CRUD modules
- Search/query indexes and filters
- Flashcards student/admin flows
- Suggestions and problem reports moderation
- Contributors, templates, logs, analytics and settings
- Bulk import preview/dry-run/batch pipeline
- Google Drive scan/classify/review/import pipeline
- AI retrieval and validated classification contract
- Firestore rules hardening and rules tests
- Migration scripts and legacy-data compatibility validation
- E2E coverage and mobile QA
- PWA/service-worker production configuration
- Production deployment configuration

## Safety rule
No destructive Firebase operation is part of the rebuild. Existing data remains the source of truth until migration is explicitly validated.

## Definition of Done
The rebuild is not considered complete until the full student/admin flows, security rules, integrations, tests, CI and production deployment have been verified. This status intentionally does not claim completion prematurely.

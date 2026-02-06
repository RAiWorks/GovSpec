# FEATURE DOCUMENT (MINIMAL)

STATUS: DRAFT
IMPLEMENTATION: FORBIDDEN

## Feature Identification
- Feature ID: 01
- Feature Name: GovSpec Web App
- Document: `docs/features/01_govspec_web_app.md`
- Registry Entry: `docs/governance/project_features.md`
- Governance Version: v2.0

## Requested By
- Requested By: Project Owner
- Requested At: 2026-02-06

## Purpose
Currently, GovSpec governance is managed entirely through markdown files edited manually or via AI in chat. There is no visual interface to view feature statuses at a glance, perform quick actions (approve, reject, review), track audit history, or receive notifications. As the number of features grows, managing everything through raw markdown becomes slow and error-prone.

This feature introduces a local web application with an API that provides a dashboard and management interface for GovSpec-governed projects.

## Motivation
- A solo developer working with AI needs a fast way to see the state of all features without reading through markdown tables
- Approving, rejecting, and changing feature statuses should be a one-click action, not a manual file edit
- Audit trails should be queryable and visible, not buried in document revision history
- Notifications should alert the developer when features need attention (new drafts proposed by AI, pending reviews, dependency issues)
- The app validates GovSpec itself — if the framework works, it should be able to govern its own development

## High Level Scope

### Included
- Local web application (runs on developer's machine per project)
- Dashboard showing all features with status, priority, dependencies
- Feature detail view rendering the markdown feature documents
- Quick actions: approve, reject, move to pending, send back to draft, mark complete
- Audit log viewer (every status change with who, when, why)
- In-app notifications (new drafts, pending reviews, dependency alerts)
- API endpoints for all feature management operations
- SQLite database for indexing, audit trail, and notification state
- Filesystem sync: reads from and writes back to `docs/` markdown files
- Markdown files remain the source of truth
- Auto-detection and parsing of existing GovSpec docs on first run (initialization)
- Handling of external file changes (detect when markdown files are edited outside the app)
- Governance version awareness (detect and reflect governance doc version changes)
- Feature document creation and editing through the app (minimal and approved templates)

### Excluded
- User authentication (solo developer, local app — no auth needed in v1)
- Multi-user / team features (planned for future GovSpec versions)
- Cloud deployment or hosting (local only in v1)
- Email or external notifications (in-app only in v1)
- Governance document editing via the app (governance docs are edited manually or via AI for safety)
- Real-time collaboration features
- Mobile app

## Dependencies
- Depends on Feature ID: None (this is the first feature)
- External dependency: Node.js runtime, npm/pnpm package manager

## Constraints
- Must run locally without requiring external services or internet connection
- Must not replace markdown files as the source of truth — the app is a layer on top
- SQLite database must be project-scoped (one database per project)
- Must follow GovSpec governance rules within its own development
- Tech stack preference (expressed by Project Owner): Next.js, TypeScript, Tailwind CSS, shadcn/ui, SQLite, Prisma/Drizzle. Final architecture decisions to be made during approved stage

## Revision History
| Date | Changed By | Description |
|------|------------|-------------|
| 2026-02-06 | AI Project Contributor | Initial draft created |
| 2026-02-06 | AI Project Contributor | Cross-check audit: added initialization behavior, external file change handling, governance version awareness, feature doc editing to Included scope. Reworded tech stack as preference. Removed ambiguous note about auto-detect (moved to Included). |

## Notes
- This app will be bundled with GovSpec docs in every new project
- The app directory structure will live alongside the `docs/` folder
- Priority is set to critical because this is the foundation for all future GovSpec tooling

---

## Rejection Record (fill only if rejected)
- Rejected By:
- Rejected At:
- Rejection Reason:
- Governance Version:

STATUS AFTER REJECTION: REJECTED — No modifications allowed unless explicitly reopened by Project Owner.

---
This document represents intent only. No implementation, architecture, APIs, schemas, or workflows are permitted at this stage.

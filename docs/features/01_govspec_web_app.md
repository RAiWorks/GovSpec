# FEATURE DOCUMENT (APPROVED)

STATUS: APPROVED
IMPLEMENTATION: ALLOWED

## Feature Identification
- Feature ID: 01
- Feature Name: GovSpec Web App
- Document: `docs/features/01_govspec_web_app.md`
- Registry Entry: `docs/governance/project_features.md`
- Governance Version: v2.0

## Approval Reference
- Approved By: Project Owner
- Approval Keyword: APPROVED
- Approval Date: 2026-02-06
- Governance Doc Version: v2.0

## Status Transition Log
| Date | From Status | To Status | Changed By | Notes |
|------|-------------|-----------|------------|-------|
| 2026-02-06 | — | draft | AI Project Contributor | Initial draft created |
| 2026-02-06 | draft | approved | Project Owner | APPROVED — skipped pending (direct approval) |

## Overview
A local web application with API that provides a dashboard and management interface for GovSpec-governed projects. It allows the Project Owner to view all features, approve/reject them with one click, track audit history, and receive notifications — all while keeping markdown files as the source of truth.

## Functional Requirements

### FR-01: Dashboard
1. The system must display all features from `project_features.md` in a table/card view
2. The system must show feature status, priority, dependencies, and dates for each feature
3. The system must visually distinguish features by status (color coding or badges)
4. The system must show a summary count of features by status (e.g., 3 draft, 2 approved, 1 completed)
5. The system must support sorting and filtering features by status, priority, and date

### FR-02: Feature Detail View
1. The system must render the full markdown content of any feature document
2. The system must display the current status banner prominently
3. The system must show the status transition log
4. The system must provide navigation back to the dashboard

### FR-03: Status Actions
1. The system must provide action buttons based on valid status transitions:
   - Draft: "Move to Pending", "Reject"
   - Pending: "Approve", "Reject", "Send Back to Draft"
   - Approved: "Mark Complete", "Revoke (Reject)"
   - Rejected: "Reopen as Draft"
   - Completed: No actions (frozen)
2. The system must require a reason when rejecting a feature
3. The system must update both the SQLite database and the markdown files when a status changes
4. The system must record who performed the action and when

### FR-04: Feature Creation
1. The system must allow creating a new feature through a form
2. The system must auto-assign the next sequential Feature ID
3. The system must generate a minimal feature document from the template
4. The system must add the entry to `project_features.md`
5. The system must set the initial status to draft

### FR-05: Feature Document Editing
1. The system must allow editing feature documents through a markdown editor
2. The system must save changes back to the filesystem
3. The system must update the revision history when a document is edited
4. The system must prevent editing of rejected and completed feature documents

### FR-06: Audit Log
1. The system must record every status change with: feature ID, from status, to status, who, when, reason
2. The system must provide a dedicated audit log view showing all changes across all features
3. The system must allow filtering the audit log by feature, status, and date range
4. The system must store audit records in SQLite (not in markdown)

### FR-07: Notifications
1. The system must generate in-app notifications for:
   - New draft features created (by AI or manually)
   - Features moved to pending (need review)
   - Dependency alerts (when a dependency is rejected or revoked)
2. The system must show a notification indicator in the UI
3. The system must allow marking notifications as read
4. The system must store notifications in SQLite

### FR-08: Filesystem Sync
1. The system must read and parse all markdown files in `docs/governance/` and `docs/features/` on startup
2. The system must detect changes to markdown files made outside the app (file watcher)
3. The system must re-sync the SQLite index when external changes are detected
4. The system must write changes back to markdown files when actions are performed in the app
5. Markdown files must always remain the source of truth — if a conflict exists, markdown wins

### FR-09: Governance Awareness
1. The system must read and display the current governance document version
2. The system must validate that feature statuses match the allowed transitions defined in governance docs
3. The system must enforce that only valid status transitions are available as actions

### FR-10: Initialization
1. On first run, the system must scan the `docs/` directory and index all existing GovSpec documents
2. The system must create the SQLite database and populate it from existing markdown files
3. The system must handle projects with no existing features (empty registry)
4. The system must validate the GovSpec directory structure and report any issues

## Non-Functional Requirements

### Performance
1. Dashboard must load in under 1 second for up to 100 features
2. Status changes must reflect in the UI immediately
3. File sync must complete within 2 seconds of detecting a change

### Security
1. The app runs locally only — no external network access required
2. No sensitive data is stored (no auth, no credentials in v1)
3. File operations must be restricted to the project's `docs/` directory

### Reliability
1. If the SQLite database is corrupted or deleted, the app must be able to rebuild it from markdown files
2. The app must handle malformed markdown gracefully (show error, don't crash)
3. File write operations must be atomic where possible (write to temp, then rename)

### Usability
1. The UI must be clean, minimal, and fast
2. All primary actions must be reachable within 2 clicks from the dashboard
3. The app must work in any modern browser (Chrome, Firefox, Edge)

## Architecture and Flow

### High-Level Architecture
```
┌─────────────────────────────────────────────┐
│                  Browser                     │
│         (Next.js Frontend + UI)              │
└──────────────────┬──────────────────────────┘
                   │ HTTP (localhost)
┌──────────────────▼──────────────────────────┐
│            Next.js API Routes                │
│         (Business Logic Layer)               │
├──────────────┬───────────────────────────────┤
│              │                               │
│   ┌──────────▼─────────┐  ┌────────────────┐│
│   │   SQLite (Prisma)  │  │  Filesystem    ││
│   │   - Audit log      │  │  - docs/       ││
│   │   - Notifications  │  │  - Read/Write  ││
│   │   - Feature index  │  │  - File watch  ││
│   └────────────────────┘  └────────────────┘│
└─────────────────────────────────────────────┘
```

### Data Flow
1. **App starts** → reads all markdown files → populates SQLite index
2. **User views dashboard** → API reads from SQLite (fast) → renders UI
3. **User performs action** (approve/reject/etc.) → API updates SQLite → writes to markdown → UI refreshes
4. **External file change detected** → file watcher triggers → re-parse markdown → update SQLite → notify UI

### Key Decision: Source of Truth
Markdown files are always the source of truth. SQLite is a derived index. If they ever disagree, markdown wins and SQLite is rebuilt.

## Inputs and Outputs

### Inputs
| Input | Type | Source | Required | Description |
|-------|------|--------|----------|-------------|
| GovSpec docs | Markdown files | `docs/` filesystem | Yes | Governance and feature documents |
| User actions | HTTP requests | Browser UI | Yes | Status changes, feature creation, edits |
| File changes | Filesystem events | OS file watcher | No | External edits to markdown files |

### Outputs
| Output | Type | Destination | Description |
|--------|------|-------------|-------------|
| Updated markdown | Files | `docs/` filesystem | Modified feature docs and registry |
| Audit records | Database rows | SQLite | Status change history |
| Notifications | Database rows + UI | SQLite + Browser | Alerts for the Project Owner |
| Dashboard UI | HTML/CSS/JS | Browser | Visual representation of project state |

## Dependencies
- Internal dependencies (other features): None — this is Feature 01
- External dependencies:
  - Node.js (v18+)
  - npm or pnpm (package manager)
  - Next.js 14+ (App Router)
  - TypeScript
  - Tailwind CSS + shadcn/ui
  - Prisma ORM + SQLite
  - A markdown parsing library (e.g., remark, gray-matter)
  - A file watching library (e.g., chokidar)

## Related Features
- No related features yet. Future features (team support, cloud sync, etc.) will depend on this one.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Markdown parsing fails on edge cases | Medium | Medium | Use battle-tested parser (remark/unified). Add error boundaries. |
| File sync conflicts (app and external edit simultaneously) | Low | High | Markdown always wins. Add conflict detection with user notification. |
| SQLite corruption | Low | Low | Rebuild from markdown. DB is a derived cache, not source of truth. |
| Feature scope creep during development | Medium | High | Follow GovSpec governance strictly. No unregistered features. |

## Edge Cases and Failure Handling
1. **Malformed markdown file**: Show a parse error in the UI with the file path. Do not crash. Allow the user to fix the file externally.
2. **Missing feature document**: If a feature is in the registry but has no document file, show a warning and offer to create one from the template.
3. **Orphan feature document**: If a document exists in `docs/features/` but is not in the registry, show it in a separate "unregistered" section.
4. **Simultaneous file change**: If a file is modified externally while the app is writing to it, detect the conflict, keep the external version (markdown wins), and notify the user.
5. **Empty project**: If no features exist, show an empty dashboard with a "Create First Feature" prompt.
6. **Database deleted**: On next startup, detect missing database and rebuild from markdown files automatically.
7. **Invalid status transition attempted**: Block the action in the UI and show which transitions are valid.

## Acceptance Criteria
1. Given a project with GovSpec docs, when the app starts for the first time, then it must scan and index all existing documents and display them on the dashboard.
2. Given a feature with status "draft", when the Project Owner clicks "Approve", then the status must update to "approved" in both SQLite and the markdown file, and an audit record must be created.
3. Given a feature with status "approved", when the Project Owner clicks "Mark Complete", then the status must update to "completed", the completion record must be filled in the document, and the feature must become read-only.
4. Given a feature is rejected, when the Project Owner provides a reason, then the rejection record must be filled in the document with the reason, date, and governance version.
5. Given a markdown file is edited outside the app, when the file watcher detects the change, then the SQLite index must be updated within 2 seconds and the UI must reflect the change.
6. Given the SQLite database is deleted, when the app restarts, then it must rebuild the database from markdown files with no data loss.
7. Given a new feature is created through the app, when the form is submitted, then a minimal feature document must be created and the registry must be updated.
8. Given any status change occurs, when the action completes, then an audit log entry must exist with feature ID, from/to status, who, when, and reason.
9. Given a feature has unmet dependencies, when the Project Owner tries to implement it, then the system must block the action and show which dependencies are not completed.
10. Given the dashboard loads, when there are features in multiple statuses, then each status must be visually distinct and the summary counts must be accurate.

## Testing Strategy
- **Unit tests**: Markdown parser, status transition logic, Feature ID generation, audit log creation
- **Integration tests**: API endpoints (CRUD features, status changes), filesystem read/write, SQLite operations
- **Manual verification**: Dashboard rendering, notification display, file watcher behavior, edge case handling (delete DB, malformed markdown, orphan files)

## Revision History
| Date | Changed By | Description |
|------|------------|-------------|
| 2026-02-06 | AI Project Contributor | Initial draft created |
| 2026-02-06 | AI Project Contributor | Cross-check audit: added initialization, file change handling, governance awareness, feature doc editing to scope |
| 2026-02-06 | AI Project Contributor | Upgraded to approved template with full specification |

## Notes
- The app directory will live alongside `docs/` in the project root (e.g., `govspec-app/`)
- Prisma is the preferred ORM for SQLite — provides type safety and migration support
- The file watcher should debounce rapid changes to avoid excessive re-syncs
- Consider adding a "Sync Now" manual button in addition to automatic file watching
- The approved template upgrade (from minimal to full) should be handled by the app when a feature is approved

---

## Completion Record (fill only when completed)
- Completed By:
- Completed At:
- All Acceptance Criteria Met:
- Governance Version:

STATUS AFTER COMPLETION: COMPLETED — Feature is frozen. No further changes unless a new related feature is created.

---
This document is the authoritative specification for implementation. Any deviation requires re-approval from the Project Owner.

# FEATURE DOCUMENT (APPROVED)

STATUS: APPROVED
IMPLEMENTATION: ALLOWED

## Feature Identification
- Feature ID: 03
- Feature Name: GovSpec Go Service
- Document: `docs/features/03_govspec_go_service.md`
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
| 2026-02-06 | draft | approved | Project Owner | APPROVED — direct approval |

## Overview
A single-binary Go application that replaces the Next.js GovSpec Web App (Feature 01) with an improved, cross-platform service. It serves the same governance management UI and API, can be installed as an OS service on Windows/Linux/macOS, and requires zero runtime dependencies. Markdown files remain the source of truth.

## Functional Requirements

### FR-01: CLI Interface
1. The system must provide a CLI with subcommands via Cobra
2. `govspec serve` must start the HTTP server in foreground mode with log output
3. `govspec install` must register the app as an OS service (Windows Service / systemd / launchd)
4. `govspec uninstall` must remove the OS service registration
5. `govspec start` must start the installed service
6. `govspec stop` must stop the running service
7. `govspec version` must print the version, build date, and commit hash
8. All subcommands must provide `--help` with usage information

### FR-02: Configuration
1. The system must load configuration from a `.env` file
2. The system must support the following configuration keys:
   - `GOVSPEC_PORT` (default: 9741)
   - `GOVSPEC_DOCS_PATH` (default: `../docs` relative to binary)
   - `GOVSPEC_DB_PATH` (default: `./govspec.db`)
   - `GOVSPEC_LOG_LEVEL` (default: `info`)
3. CLI flags must override `.env` values
4. The system must work with zero configuration using sensible defaults
5. The `.env` file must be searched in: current directory, binary directory, `~/.govspec/`

### FR-03: HTTP Server
1. The system must serve HTTP on the configured port using Chi router
2. The system must serve the embedded React SPA for all non-API routes
3. The system must handle graceful shutdown on SIGINT/SIGTERM
4. The system must support CORS (configurable, enabled by default for development)
5. The system must provide structured JSON logging via slog
6. The system must provide a `GET /api/v1/health` endpoint returning server status

### FR-04: Dashboard API
1. `GET /api/v1/features` must return all features (auto-syncs from markdown first)
2. `GET /api/v1/features/:id` must return feature detail with document content and audit logs
3. `POST /api/v1/features` must create a new draft feature (generates markdown + registry entry)
4. Response format must be JSON with consistent error structure: `{"error": "message"}`

### FR-05: Status Transitions API
1. `PUT /api/v1/features/:id/status` must change feature status
2. The system must validate transitions against the allowed transition map:
   - draft → pending, rejected
   - pending → approved, rejected, draft
   - approved → completed, rejected
   - rejected → draft
   - completed → (none)
3. The system must require a reason when rejecting a feature
4. The system must check dependency completion before allowing approved → completed
5. Status changes must update both SQLite and markdown files atomically
6. Status changes must create an audit log entry and a notification

### FR-06: Audit Log API
1. `GET /api/v1/audit` must return all audit log entries, newest first
2. The endpoint must support filtering by `featureId` query parameter
3. Each entry must include: feature ID, feature name, from/to status, changed by, reason, timestamp

### FR-07: Notifications API
1. `GET /api/v1/notifications` must return notifications with unread count
2. `PUT /api/v1/notifications/read` must mark all notifications as read
3. Notifications must be generated for: new drafts, pending reviews, dependency alerts, status changes

### FR-08: Sync API
1. `POST /api/v1/sync` must trigger a manual sync from markdown files to SQLite
2. The sync must: parse the feature registry, upsert features, remove orphaned DB entries, update governance version
3. Markdown always wins in case of conflict

### FR-09: Governance API
1. `GET /api/v1/governance` must return the governance document version and content

### FR-10: Markdown Parser/Writer
1. The system must parse `project_features.md` registry table into structured data
2. The system must parse individual feature documents (status, implementation, feature ID, name, content)
3. The system must write back to the registry when features are created or status changes
4. The system must update feature document STATUS and IMPLEMENTATION lines on status change
5. The system must generate feature documents from the minimal template
6. The parser must handle malformed markdown gracefully (log warning, skip bad entries)

### FR-11: Database
1. The system must use SQLite via pure Go driver (`modernc.org/sqlite`)
2. The system must run migrations on startup automatically
3. Schema must include: features, audit_log, notifications, govspec_meta tables
4. The schema must be compatible with Feature 01's Prisma schema (same columns, same types)
5. The system must rebuild the database from markdown if the DB file is missing

### FR-12: Embedded Frontend
1. The React SPA must be compiled and embedded into the Go binary via `go:embed`
2. The frontend must use Vite + TypeScript + Tailwind CSS + shadcn/ui
3. The frontend must provide: dashboard with status summary, feature table, feature detail page, audit log, notifications, create feature dialog, markdown preview
4. The frontend must call `/api/v1/...` endpoints
5. The frontend must handle loading states, errors, and empty states gracefully

### FR-13: OS Service Support
1. On Windows: install/uninstall as a Windows Service using `golang.org/x/sys/windows/svc`
2. On Linux: generate and install a systemd unit file
3. On macOS: generate and install a launchd plist
4. The service must auto-restart on failure
5. The service must log to the OS-appropriate log facility (Event Log / journald / syslog)

## Non-Functional Requirements

### Performance
1. Dashboard API must respond in under 100ms for up to 100 features
2. The Go binary must start and be ready to serve in under 2 seconds
3. Sync from markdown must complete in under 1 second for up to 100 features
4. The embedded SPA must load in under 500ms on localhost

### Security
1. The app runs locally only — binds to 127.0.0.1 by default
2. No authentication in v1 (solo developer scope)
3. File operations must be restricted to the configured docs path
4. SQL queries must use parameterized statements (no string concatenation)

### Reliability
1. If the SQLite database is missing or corrupted, the app must rebuild from markdown
2. Malformed markdown must not crash the server — log and skip
3. Graceful shutdown must drain active connections (5 second timeout)
4. File writes should use write-to-temp-then-rename where possible

### Portability
1. The binary must compile for windows/amd64, linux/amd64, linux/arm64, darwin/amd64, darwin/arm64
2. No CGO dependencies — pure Go only
3. No platform-specific code except in the svcmanager package (build-tagged)

### Usability
1. Zero-config startup: `govspec serve` must work with no .env file
2. Clear error messages for all failure modes
3. Colored log output in terminal mode (no color when running as service)

## Architecture and Flow

### High-Level Architecture
```
┌─────────────────────────────────────────────────┐
│                   Browser                        │
│          (Embedded React SPA)                    │
└──────────────────┬──────────────────────────────┘
                   │ HTTP (localhost:9741)
┌──────────────────▼──────────────────────────────┐
│              Go HTTP Server (Chi)                 │
│         ┌────────────────────────┐               │
│         │   Middleware Stack     │               │
│         │  (Logger, CORS, etc.)  │               │
│         └────────┬───────────────┘               │
│                  │                               │
│         ┌────────▼───────────┐                   │
│         │   API Handlers     │                   │
│         │  /api/v1/...       │                   │
│         └────────┬───────────┘                   │
│                  │                               │
│         ┌────────▼───────────┐                   │
│         │  Service Layer     │                   │
│         │  (Business Logic)  │                   │
│         └───┬────────────┬───┘                   │
│             │            │                       │
│   ┌─────────▼────┐  ┌───▼──────────────┐        │
│   │  Repository   │  │  Markdown Pkg    │        │
│   │  (SQLite)     │  │  (Parse/Write)   │        │
│   └──────┬────────┘  └───┬──────────────┘        │
│          │               │                       │
│   ┌──────▼────┐    ┌────▼───────────┐            │
│   │ govspec.db│    │ docs/ (files)  │            │
│   └───────────┘    └────────────────┘            │
└─────────────────────────────────────────────────┘
```

### Data Flow
1. **Startup** → run migrations → sync markdown to SQLite → start HTTP server
2. **Dashboard request** → handler calls service → service reads from SQLite → returns JSON
3. **Status change** → handler validates → service updates SQLite + writes markdown → creates audit + notification → returns updated feature
4. **Manual sync** → service re-parses all markdown → upserts SQLite → returns sync result
5. **SPA routing** → any non-API route serves `index.html` → React handles client-side routing

### Package Dependency Flow
```
cmd/govspec → internal/server → internal/handler → internal/service → internal/repository
                                                                    → internal/markdown
                                                 → internal/model (shared types)
             → internal/svcmanager (OS service management)
```

## Inputs and Outputs

### Inputs
| Input | Type | Source | Required | Description |
|-------|------|--------|----------|-------------|
| GovSpec docs | Markdown files | `docs/` filesystem | Yes | Governance and feature documents |
| User actions | HTTP requests | Browser UI | Yes | Status changes, feature creation |
| .env config | Key-value file | Filesystem | No | Port, paths, log level |
| CLI flags | Command-line args | Terminal | No | Override .env values |

### Outputs
| Output | Type | Destination | Description |
|--------|------|-------------|-------------|
| Updated markdown | Files | `docs/` filesystem | Modified feature docs and registry |
| Audit records | SQLite rows | govspec.db | Status change history |
| Notifications | SQLite rows + JSON | govspec.db + Browser | Alerts for the Project Owner |
| Dashboard UI | HTML/CSS/JS | Browser | Embedded React SPA |
| Structured logs | JSON/text | stdout / OS log | Server activity and errors |

## Dependencies
- Internal dependencies: Feature 01 (design reference — approved)
- External dependencies (build-time only):
  - Go 1.22+
  - Node.js 18+ (for building the React frontend)
  - npm (for frontend dependencies)
- Go module dependencies:
  - `github.com/go-chi/chi/v5` — HTTP router
  - `github.com/go-chi/cors` — CORS middleware
  - `modernc.org/sqlite` — Pure Go SQLite driver
  - `github.com/spf13/cobra` — CLI framework
  - `github.com/joho/godotenv` — .env file loading
  - `golang.org/x/sys` — Windows service API (build-tagged)

## Related Features
- Related to Feature ID: 01 — This is the Go rewrite/replacement of the Next.js GovSpec Web App

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Pure Go SQLite driver performance | Low | Low | modernc.org/sqlite is battle-tested; our dataset is tiny |
| Embedded SPA increases binary size | Medium | Low | Vite produces small bundles; gzip in embed; acceptable tradeoff for single-binary |
| OS service APIs differ significantly | Medium | Medium | Build tags isolate platform code; test on each OS; graceful fallback |
| Markdown parser edge cases | Medium | Medium | Port proven logic from Feature 01; add error recovery; log warnings |
| Cross-compilation issues | Low | Medium | Pure Go (no CGO) eliminates most issues; CI matrix testing |

## Edge Cases and Failure Handling
1. **Missing docs directory**: Log error with clear message, exit with non-zero code. Don't create docs — that's the user's responsibility.
2. **Malformed registry table**: Skip unparseable rows, log warnings, continue with valid entries.
3. **Missing feature document**: Show warning in API response, feature still appears in list from registry.
4. **Database file locked**: Retry with backoff (3 attempts), then return 503.
5. **Port already in use**: Clear error message with the port number and suggestion to change via .env.
6. **Empty project (no features)**: Return empty arrays, frontend shows "Create First Feature" prompt.
7. **Database deleted while running**: Next sync recreates tables and repopulates from markdown.
8. **Invalid .env values**: Log warning, fall back to defaults for invalid values.
9. **Service install without admin/root**: Clear error message explaining elevated privileges are required.
10. **Concurrent status changes**: SQLite serializes writes; second request gets fresh state after first completes.

## Acceptance Criteria
1. Given a fresh system with Go installed, when the user runs `go build` and `./govspec serve`, then the server must start on port 9741 and serve the dashboard.
2. Given the server is running, when the user opens `http://localhost:9741` in a browser, then the React SPA must load and display the dashboard with features from markdown.
3. Given a feature with status "draft", when the user clicks "Move to Pending" in the UI, then the status must update in both SQLite and the markdown file, and an audit entry must be created.
4. Given the CLI, when the user runs `govspec install` with appropriate privileges, then the app must be registered as an OS service.
5. Given the app is installed as a service, when the OS reboots, then the service must start automatically.
6. Given the SQLite database is deleted, when the server starts, then it must rebuild the database from markdown files.
7. Given a `.env` file with `GOVSPEC_PORT=8888`, when the server starts, then it must listen on port 8888.
8. Given any API error, when the client receives the response, then it must be a JSON object with an `error` field and appropriate HTTP status code.
9. Given the binary is built with `GOOS=linux GOARCH=amd64`, when it runs on a Linux system, then all features must work identically to the Windows build.
10. Given the `govspec version` command, when executed, then it must print the version number, build date, and git commit hash.

## Testing Strategy
- **Unit tests**: Markdown parser, status transition validation, feature ID generation, config loading
- **Integration tests**: API endpoints (create feature, change status, sync), SQLite operations, markdown read/write round-trip
- **Build tests**: Cross-compilation for all target platforms (CI matrix)
- **Manual verification**: Dashboard rendering, service install/uninstall on Windows/Linux/macOS, graceful shutdown, edge cases

## Revision History
| Date | Changed By | Description |
|------|------------|-------------|
| 2026-02-06 | AI Project Contributor | Initial draft created |
| 2026-02-06 | AI Project Contributor | Upgraded to approved template with full specification |

## Notes
- Project directory: `govspec-go/` alongside `govspec-app/`
- Build: `make all` compiles frontend + Go binary
- Cross-compile: `make build-windows`, `make build-linux`, `make build-darwin`
- Config precedence: CLI flags > .env > defaults
- The frontend is a separate Vite project inside `govspec-go/web/` — built independently, then embedded
- Chi was chosen over Gin/Echo for stdlib compatibility and minimal footprint
- Cobra was chosen as the CLI standard (kubectl, docker, hugo all use it)
- modernc.org/sqlite was chosen over mattn/go-sqlite3 to avoid CGO and enable clean cross-compilation

---

## Completion Record (fill only when completed)
- Completed By:
- Completed At:
- All Acceptance Criteria Met:
- Governance Version:

STATUS AFTER COMPLETION: COMPLETED — Feature is frozen. No further changes unless a new related feature is created.

---
This document is the authoritative specification for implementation. Any deviation requires re-approval from the Project Owner.

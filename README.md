# GovSpec

A governance-driven development framework that enforces structured, auditable feature lifecycles for software projects. Designed for solo developers working with AI assistants.

## What is GovSpec?

GovSpec is a set of governance documents and rules that control how features are proposed, reviewed, approved, and implemented in any software project. It ensures that no code is written without explicit approval, every decision is traceable, and AI assistants operate within clearly defined boundaries.

GovSpec is not a project — it is a framework you apply to your projects.

## Why GovSpec?

When working with AI coding assistants, things can move fast — sometimes too fast. Features get built without proper review, scope creeps silently, and there is no audit trail of what was decided and why.

GovSpec solves this by introducing a simple but strict governance layer:

- Every feature must be documented before it can be built
- Every feature must be explicitly approved by the human developer
- AI assistants can suggest and document, but cannot implement without permission
- Every status change is recorded for full traceability
- Governance rules cannot be overridden by chat — the AI follows the protocol

## GovSpec in Action

Here's an example of GovSpec's governance enforcement. When asked to delete a feature (which violates the rules), the AI stops, cites the specific rule, and follows the Conflict Resolution Protocol:

<p align="center">
  <img src="assets/screenshots/govspec-governance-enforcement.png" alt="GovSpec Governance Enforcement" width="600" />
</p>
<p align="center"><em>GovSpec AI Conflict Resolution — the AI stops, cites the rule, and waits for the Project Owner</em></p>

## How It Works

### Feature Lifecycle

```
draft → pending → approved → completed
  ↓        ↓         ↓
rejected  rejected  rejected
  ↓
draft (if reopened)
```

| Status | What Happens |
|--------|-------------|
| draft | Idea is captured in a minimal document. No implementation allowed. |
| pending | Under review by the Project Owner. Still no implementation. |
| approved | Explicitly approved. Full specification written. Implementation begins. |
| rejected | Permanently closed with a reason. Kept for audit. Can be reopened. |
| completed | Fully implemented and verified. Feature is frozen. |

### Authority Hierarchy

1. Governance Documents — the rules of the system (highest authority)
2. Feature Registry — the single source of truth for all features
3. Explicit Approval — the keyword `APPROVED` from the Project Owner
4. Chat / Informal Instructions — lowest authority, cannot override rules

### Roles

| Role | Who | Can Do |
|------|-----|--------|
| Project Owner | The human developer | Approve, reject, change statuses, modify governance docs |
| AI Project Contributor | The AI assistant | Analyze, suggest, document, implement (only when approved) |

## GovSpec Go Service (Recommended)

The primary way to run GovSpec. A single self-contained binary with the web UI embedded — no runtime dependencies, no Node.js, no npm. Runs on Windows, Linux, and macOS. Can be installed as an OS service.

### Features
- Single binary — copy and run, zero dependencies
- Embedded React SPA with dashboard, feature management, audit log, notifications
- Versioned REST API (`/api/v1/...`) with health check endpoint
- CLI with subcommands: `serve`, `install`, `uninstall`, `start`, `stop`, `version`
- OS service support: Windows Service, systemd (Linux), launchd (macOS)
- SQLite database (pure Go, no CGO) — cross-compiles to all platforms
- Configurable via `.env` file or CLI flags
- Structured logging, graceful shutdown, CORS support
- Markdown files remain the source of truth

### Quick Start

```bash
cd govspec-go
go build -o govspec ./cmd/govspec
./govspec serve
```

Open http://127.0.0.1:9741 in your browser.

### CLI Usage

```bash
# Run in foreground (terminal mode)
govspec serve

# Run with custom port and docs path
govspec serve --port 8080 --docs /path/to/docs

# Install as OS service (requires admin/root)
govspec install

# Start/stop the service
govspec start
govspec stop

# Remove the service
govspec uninstall

# Print version
govspec version
```

### Configuration (.env)

```env
GOVSPEC_PORT=9741
GOVSPEC_DOCS_PATH=../docs
GOVSPEC_DB_PATH=./govspec.db
GOVSPEC_LOG_LEVEL=info
```

Config precedence: CLI flags > `.env` file > defaults. The app works with zero configuration.

### Building from Source

```bash
cd govspec-go

# Build frontend + Go binary
cd web && npm install && npm run build && cd ..
# Copy built frontend into embed directory
# Windows:
xcopy web\dist\* cmd\govspec\web\ /s /e /y
# Linux/macOS:
cp -r web/dist/* cmd/govspec/web/

# Build the Go binary
go build -o govspec ./cmd/govspec
```

### Cross-Compilation

```bash
# Linux
GOOS=linux GOARCH=amd64 go build -o govspec-linux ./cmd/govspec

# macOS (Apple Silicon)
GOOS=darwin GOARCH=arm64 go build -o govspec-darwin ./cmd/govspec

# Windows
GOOS=windows GOARCH=amd64 go build -o govspec.exe ./cmd/govspec
```

### Tech Stack
- Go (Chi router, pure Go SQLite, Cobra CLI, slog logging)
- React + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui
- SQLite via `modernc.org/sqlite` (no CGO)

## GovSpec Web App (Legacy — Next.js)

The original web application built with Next.js. Still functional but requires Node.js and npm.

### Running the Legacy App

```bash
cd govspec-app
npm install
npx prisma migrate dev
npm run dev
```

Open http://localhost:3000 in your browser.

## Project Structure

```
your-project/
├── README.md
├── docs/
│   ├── governance/
│   │   ├── project_development_instructions.md    # Rules and constraints
│   │   └── project_features.md                    # Feature registry
│   └── features/
│       ├── _template_minimal_feature.md           # Template for draft features
│       ├── _template_approved_feature.md          # Template for approved features
│       └── [NN_feature_name.md]                   # Individual feature documents
├── govspec-go/                                    # Go service (recommended)
│   ├── cmd/govspec/                               # CLI entrypoint + embedded web
│   ├── internal/                                  # Server, handlers, services, repos
│   ├── web/                                       # React SPA source (Vite)
│   ├── go.mod
│   └── .env                                       # Configuration
└── govspec-app/                                   # Next.js app (legacy)
    ├── prisma/                                    # Database schema and migrations
    └── src/                                       # Next.js application
```

## Getting Started

### 1. Add GovSpec to Your Project

Copy the `docs/` folder into your project root. That is it — GovSpec is now active.

### 2. Instruct Your AI Assistant

At the start of any AI-assisted session, ensure the AI reads:
1. `docs/governance/project_development_instructions.md`
2. `docs/governance/project_features.md`

This establishes the rules before any work begins.

### 3. Propose a Feature

When a new idea comes up:
1. A draft entry is added to `project_features.md`
2. A minimal feature document is created from the template
3. You review it and decide: approve, reject, or send back for revision

### 4. Approve and Build

Say `APPROVED` to greenlight a feature. The minimal document gets upgraded to a full specification, and only then does implementation begin.

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Stable releases only. Protected. |
| `develop` | Active development. Feature branches merge here. |
| `feature/NN-feature-name` | Per-feature branches (e.g., `feature/03-govspec-go-service`) |
| `docs/description` | Documentation-only changes |
| `hotfix/description` | Emergency fixes to main |

## Current Version

- Governance Documents: v2.0
- Scope: Solo developer + AI assistant
- Future: Team, organization, and multi-project support planned

## Roadmap

| Feature ID | Feature Name | Status |
|------------|-------------|--------|
| 01 | GovSpec Web App (Next.js) | approved |
| 03 | GovSpec Go Service | approved |

See `docs/governance/project_features.md` for the full feature registry.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Contributing

GovSpec is currently in early development. Contribution guidelines will be added when the project opens for external contributions.

# Project Features

## Version
v2.0

## Governance Reference
Follows: `project_development_instructions.md` v2.0

## Purpose
This document is the single source of truth for all features in any GovSpec-governed project. No feature may be implemented unless it is listed here with status set to `approved`. This document acts as the feature registry.

## Status Definitions
| Status | Meaning | Implementation |
|--------|---------|----------------|
| draft | Idea documented, not yet reviewed | Forbidden |
| pending | Under active review by Project Owner | Forbidden |
| approved | Explicitly approved by Project Owner | Allowed |
| rejected | Permanently rejected, kept for audit | Forbidden |
| completed | Fully implemented and verified | Frozen (maintenance only) |

## Feature Index

| Feature ID | Feature Name | Status | Priority | Depends On | Requested By | Requested At | Approved At | Rejected At | Completed At | Related Docs | Notes |
|------------|--------------|--------|----------|------------|--------------|--------------|-------------|-------------|--------------|--------------|-------|
| 01 | GovSpec Web App | approved | critical | — | Project Owner | 2026-02-06 | 2026-02-06 | — | — | `docs/features/01_govspec_web_app.md` | Core application for managing GovSpec via web UI and API |
| 02 | Test | pending | normal | — | Project Owner | 2026-02-06 | — | — | — | `docs/features/02_test.md` | Test |
| 03 | GovSpec Go Service | approved | critical | 01 | AI Project Contributor | 2026-02-06 | 2026-02-06 | — | — | `docs/features/03_govspec_go_service.md` | Go rewrite of GovSpec Web App — single binary, OS service support, cross-platform |

## Feature ID Rules
- Feature IDs are numeric and sequential: `01`, `02`, `03`, etc.
- Feature IDs are never reused, even for rejected features
- The corresponding feature document must be named `NN_feature_name.md` (e.g., `01_user_authentication.md`)
- The feature name in the filename should be a short, lowercase, underscore-separated descriptor

## Priority Levels
Priority is optional but recommended for projects with multiple approved features:
| Priority | Meaning |
|----------|---------|
| critical | Must be implemented before anything else |
| high | Should be implemented soon |
| normal | Standard priority, no urgency |
| low | Nice to have, implement when possible |

Priority is set by the Project Owner. The AI must not assign or change priority without instruction.

## Dependency Rules
- The `Depends On` column lists Feature IDs that must be completed before this feature can be implemented
- A feature with unmet dependencies cannot be implemented even if approved
- Circular dependencies are not allowed and must be flagged immediately
- If a dependency is rejected or revoked, all dependent features must be flagged to the Project Owner for resolution before any work continues

## Document Requirements by Status
| Status | Required Document |
|--------|-------------------|
| draft | Minimal feature document (`_template_minimal_feature.md`) |
| pending | Minimal feature document (`_template_minimal_feature.md`) |
| approved | Full approved feature document (`_template_approved_feature.md`) |
| rejected | Existing document with Rejection section filled |
| completed | Approved document with Completion section filled |

## Change Control
- Any new feature or improvement must be added as a `draft` first
- Any status change requires explicit Project Owner instruction
- Status changes must be recorded with dates in the appropriate column of the Feature Index
- This document follows the same versioning pattern as governance documents (v1.0 → v2.0 → v3.0)
- Version increments when: features are added, statuses change, or structural changes are made to this document

## Audit Trail
- No row may be deleted from the Feature Index
- Rejected and completed features remain permanently
- The Feature Index combined with individual feature documents forms the complete audit trail

## Enforcement
Any feature not listed in this document is considered non-existent. Any feature not marked `approved` is considered non-executable. The AI must verify this document before taking any implementation action.

---
This document is subordinate only to `project_development_instructions.md`. All feature-related decisions flow through this registry.

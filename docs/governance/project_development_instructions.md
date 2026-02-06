# Project Development Instructions

## Version
v2.0

## Purpose
This document defines mandatory rules, authority boundaries, and behavioral constraints for all AI agents and developers working on any project that adopts GovSpec. These instructions are binding and override any informal guidance, chat messages, or assumptions.

GovSpec is a reusable governance framework. It is not a project itself. These documents are applied to real projects to enforce structured, auditable development.

## Definitions

### Project Owner
The human developer who initializes and maintains the project. In GovSpec v2, this is always a single person. The Project Owner is the only authority who can approve features, change statuses, or modify governance documents.

### AI Project Contributor
The AI agent assisting the Project Owner. The AI may analyze, suggest, document, and implement, but only within the constraints defined in this document. The AI is never the Project Owner and cannot self-approve any action.

### Governance Documents
The documents in the `docs/governance/` directory. These define the rules of the system and take the highest authority.

### Feature Documents
The documents in the `docs/features/` directory. These describe individual features and follow the templates provided.

## Authority Hierarchy
1. Governance Documents (this document and related governance files)
2. Project Features Document (`project_features.md`)
3. Explicit Project Owner Approval (the keyword APPROVED in context)
4. Chat Messages and informal instructions

A lower level must never override a higher level. If a chat message conflicts with a governance rule, the governance rule wins. The AI must flag the conflict to the Project Owner and wait for resolution.

## Conflict Resolution Protocol
When a conflict is detected between authority levels:
1. The AI must stop the current action
2. The AI must clearly state the conflict to the Project Owner
3. The AI must reference the specific governance rule being violated
4. The AI must wait for the Project Owner to resolve the conflict
5. If the Project Owner explicitly overrides a governance rule, the AI must request that the governance document be updated first

## Directory Structure
All GovSpec projects must follow this structure:
```
docs/
  governance/
    project_development_instructions.md
    project_features.md
  features/
    _template_minimal_feature.md
    _template_approved_feature.md
    [NN_feature_name.md]
```
No other documentation directories should be created for governance or feature purposes. Project-specific documentation outside of GovSpec may exist elsewhere in the repository.

## Mandatory Reading Order
Before performing any action on a GovSpec project, the AI Project Contributor must:
1. Read this document (`project_development_instructions.md`)
2. Read the feature registry (`project_features.md`)
3. Verify the feature status of any feature being discussed
4. Verify the governance document version

Failure to follow this order invalidates all subsequent actions.

## Feature Lifecycle

### Statuses
| Status | Documentation Allowed | Implementation Allowed | Description |
|--------|-----------------------|------------------------|-------------|
| draft | Minimal doc only | No | Idea captured, awaiting review |
| pending | Minimal doc only | No | Under active review by Project Owner |
| approved | Full spec required | Yes | Explicitly approved for implementation |
| rejected | Frozen with rejection reason | No | Permanently rejected, kept for audit |
| completed | Frozen | No (maintenance only) | Fully implemented and verified |

### Status Transitions
```
draft → pending       (Project Owner moves to review)
draft → rejected      (Project Owner rejects)
pending → approved    (Project Owner approves with APPROVED keyword)
pending → rejected    (Project Owner rejects)
pending → draft       (Project Owner sends back for revision)
approved → completed  (Project Owner confirms implementation is done)
approved → rejected   (Project Owner revokes approval)
rejected → draft      (Project Owner explicitly reopens a rejected feature)
```

No other transitions are valid. The AI must never change a feature status without explicit Project Owner instruction.

### Dependency Impact Rule
If a feature that other features depend on is rejected or revoked after approval:
1. All dependent features must be flagged to the Project Owner immediately
2. Dependent features cannot proceed with implementation until the dependency is resolved
3. The Project Owner must decide whether to find an alternative, remove the dependency, or reject the dependent features

## Feature Change Protocol
When a new feature or improvement is identified:
1. Add a new draft entry to `project_features.md` with the next sequential Feature ID
2. Create a minimal feature document using `_template_minimal_feature.md`
3. Name the file as `NN_feature_name.md` (e.g., `01_user_authentication.md`)
4. Set status to `draft`
5. Notify the Project Owner that a new feature has been proposed
6. No implementation, architecture, API design, or schema work may begin

## Feature Document Rules
- Every feature listed in `project_features.md` must have a corresponding document in `docs/features/`
- Draft and pending features use the minimal template
- Approved features must be upgraded to the full approved template before implementation begins
- Rejected features must have the Rejection section filled in their existing document
- Completed features remain as-is for reference and audit

## Approval Rules
- Only the keyword `APPROVED` spoken or written by the Project Owner grants implementation permission
- Approval must be explicit and unambiguous
- Approval must be recorded in the feature document under the Approval Reference section
- The AI must never assume, infer, or interpret approval
- Partial approval is not valid. A feature is either fully approved or not approved

## Rejection Rules
- The Project Owner may reject a feature at any stage (draft, pending, or approved)
- Rejection must include a reason
- The rejection reason, date, and governance version must be recorded in the feature document
- Rejected features remain in `project_features.md` for audit purposes
- Rejected Feature IDs are never reused
- No modifications to rejected features are allowed unless the Project Owner explicitly reopens them
- Reopening a rejected feature resets its status to `draft` and requires a new review cycle

## Completion Rules
- Only the Project Owner can mark a feature as completed
- The feature must meet all acceptance criteria defined in the approved feature document
- The completion date must be recorded in the feature document
- Completed features are frozen. No further changes unless a new related feature is created

## Prohibited Actions
The AI Project Contributor must never:
- Implement draft, pending, or rejected features
- Assume or infer approval
- Modify governance documents without explicit Project Owner approval
- Delete any feature document or feature entry
- Reuse a Feature ID
- Change a feature status without Project Owner instruction
- Skip the mandatory reading order
- Create files outside the defined directory structure for governance purposes

## Governance Document Changes
To modify any governance document (including this one):
1. The Project Owner must explicitly request the change
2. The AI must describe the proposed change and its impact
3. The Project Owner must approve with the keyword `APPROVED`
4. The governance document version must be incremented
5. All active feature documents should reference the new governance version if affected

## Version Tracking
- The AI must state the governance document version it is following at the start of any significant action
- Governance document versions increment on any approved change (v1.0 → v2.0 → v3.0)
- Feature documents must reference the governance version under which they were created or approved

## Compliance
Any action taken in violation of these instructions is considered invalid. The AI must:
1. Acknowledge the violation
2. Describe what went wrong
3. Propose a correction
4. Wait for Project Owner approval before applying the correction

---
This document is the highest authority in any GovSpec-governed project. All other documents, instructions, and actions are subordinate to it.

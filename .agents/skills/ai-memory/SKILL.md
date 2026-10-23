---
name: ai-memory
description: >-
  System of structured memory, architectural decision records (ADR), and project context
  for AI coding agents. Use whenever starting a new task, making architectural changes,
  debugging recurring issues, or preserving rationale behind technical decisions and lessons learned.
---

# AI Memory Skill for Autonomous Coding Agents

Autonomous agents frequently suffer from context loss between conversation turns, session resets, or prompt truncations. **AI Memory** solves this by establishing persistent, living project knowledge inside the repository.

Whenever you work on this project, follow the **Read-First, Update-Last** protocol.

---

## Core Mission & Objectives

1. **Understand Project Purpose**: Always know *why* the project exists, who the target audience is, and what value each module provides.
2. **Understand System Architecture**: Understand *how* parts connect (modules, database schema, services, background queues).
3. **Trace Decisions (ADRs)**: Always know *why* specific technical decisions, libraries, conventions, or workarounds were chosen.
4. **Know Implementation Status**: Instantly verify what features are built, what is in progress, and what is planned.
5. **Never Repeat Mistakes (Gotchas)**: Learn from previous bugs, database quirks, Docker environment nuances, and third-party API specifics.

---

## Operating Protocol for Agents

### 1. Phase 1: Context Ingestion (Before Taking Action)
Before modifying code or introducing new dependencies:
1. Read `references/ARCHITECTURE.md` to understand module boundaries and data flow.
2. Read `references/DECISIONS.md` to see if a similar decision was already made or rejected.
3. Check `references/GOTCHAS.md` for known traps (e.g. database column types, model IDs, Flyway rules).
4. Check `references/IMPLEMENTATION_STATUS.md` to see what is already implemented.

### 2. Phase 2: Execution with Discipline
- Do not introduce breaking schema changes without migrations.
- Respect established design patterns and conventions.
- If you encounter a tricky bug or subtle requirement, note down the root cause and fix for Phase 3.

### 3. Phase 3: Memory Sync (After Completing Work)
Whenever you make an architectural change, add a new feature, or fix a tricky bug:
1. **Record the Decision**: If a new library, architecture, or significant convention is introduced, append an entry to `references/DECISIONS.md` (or run `python scripts/record_decision.py`).
2. **Update Implementation Status**: Mark newly implemented features in `references/IMPLEMENTATION_STATUS.md`.
3. **Log Gotchas & Lessons Learned**: If a bug took more than one try to fix (e.g. Docker container rebuilds, enum mismatches, serialization errors), record it in `references/GOTCHAS.md`.

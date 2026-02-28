---
title: "Oskit Next Features Roadmap"
description: "4-phase plan: settings persistence, config editors, workflow tools, and polish features for the macOS developer toolkit"
status: pending
priority: P1
effort: 40h
branch: master
tags: [tauri, settings, config-editors, workflow-tools, polish]
created: 2026-02-28
---

# Oskit Next Features Roadmap

## Overview

Comprehensive implementation plan for 13 new features across 4 phases, building on oskit's existing tool installation manager and zshrc editor. Each phase builds on the previous — Phase 1 is foundational and must complete first.

## Current Architecture

- **Stack:** Tauri v2 + React 19 + TypeScript + TanStack Router + Tailwind CSS v4
- **Pattern:** Feature-based folders (`features/{name}/components/`, `hooks/`, `utils/`)
- **Data:** YAML-driven config → parser → hook → components
- **Shell:** `@tauri-apps/plugin-shell` for all CLI commands
- **Layout:** `<Section>` UI primitives for all pages
- **Icons:** `@hugeicons/core-free-icons`

## Key Architectural Decision

Extract a **reusable config editor pattern** from the existing zshrc editor:
- `useConfigFile(path)` — shared hook for file I/O, backup, restore
- `parseConfigFile(content, format)` — format-aware parser (ini, ssh, hosts)
- Visual editor sub-components per section type

## Phases

### Phase 1: Foundation — [phase-01-foundation.md](phase-01-foundation.md)
- **Status:** pending
- **Effort:** 8h
- **Features:** Settings persistence (`tauri-plugin-store`), wire settings page, Homebrew health check, update checker badges
- **Why first:** All other features depend on persisted settings

### Phase 2: Config Management Hub — [phase-02-config-management-hub.md](phase-02-config-management-hub.md)
- **Status:** pending
- **Effort:** 12h
- **Features:** Git config editor, SSH key manager, hosts file editor
- **Prereq:** Phase 1 (settings store for user preferences)

### Phase 3: Workflow Tools — [phase-03-workflow-tools.md](phase-03-workflow-tools.md)
- **Status:** pending
- **Effort:** 12h
- **Features:** Port manager, system info dashboard, project launcher
- **Prereq:** Phase 1 (settings store for scan directories, refresh intervals)

### Phase 4: Polish & Delight — [phase-04-polish-and-delight.md](phase-04-polish-and-delight.md)
- **Status:** pending
- **Effort:** 8h
- **Features:** Onboarding wizard, export/import setup recipe, disk usage analyzer
- **Prereq:** Phases 1-3 (references all existing features)

## Dependencies

| Dependency | Phase | Type |
|---|---|---|
| `tauri-plugin-store` | 1 | npm + Cargo |
| `@tauri-apps/plugin-store` | 1 | npm |
| No new deps | 2-4 | — |

## References

- Brainstorm report: [brainstorm-260228-1111-next-features-roadmap.md](../reports/brainstorm-260228-1111-next-features-roadmap.md)
- Existing zshrc editor pattern: `src/features/shell/`
- Installation state pattern: `src/features/installation/utils/use-installation-state.ts`

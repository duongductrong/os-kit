---
title: "Release-Only Commit Trigger"
description: "Restrict releases to only 'release:' commit type, all other types become normal flow"
status: pending
priority: P2
effort: 15m
branch: master
tags: [ci-cd, semantic-release, config]
created: 2026-02-28
---

# Release-Only Commit Trigger

## Overview

Modify `@semantic-release/commit-analyzer` config so only commits with type `release:` trigger a new version bump + build + GitHub Release. All other commit types (`feat`, `fix`, `chore`, etc.) pass through as normal commits — no release pipeline triggered.

## Phases

| # | Phase | Effort | Status | File |
|---|-------|--------|--------|------|
| 1 | Modify semantic-release config | 15m | pending | [phase-01](./phase-01-release-commit-filter.md) |

## Progress

- [ ] Phase 1: Update `.releaserc.json` with custom `releaseRules`

## Key Decisions

- **Only `release:` type triggers releases** — all others explicitly set to no release
- **`release!:` or `BREAKING CHANGE` in `release:` body** → major bump
- **`release:` default** → minor bump (new version = new features bundled)
- **No workflow changes** — semantic-release handles filtering; `released == 'true'` gate already exists

## Architecture

```
commit "feat: add X" → push to master → semantic-release → no release → done
commit "release: v1.1" → push to master → semantic-release → bump → tag → build → publish
```

## Risks

- Developers must remember to use `release:` type; consider adding docs to CONTRIBUTING section

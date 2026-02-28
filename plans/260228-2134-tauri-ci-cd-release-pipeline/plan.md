---
title: "Tauri CI/CD Release Pipeline"
description: "GitHub Actions build + release pipeline for OS Kit with Homebrew cask distribution"
status: pending
priority: P1
effort: 3h
branch: master
tags: [ci-cd, tauri, github-actions, homebrew, release]
created: 2026-02-28
---

# Tauri CI/CD Release Pipeline

## Overview

Automated build, release, and distribution pipeline for **OS Kit** (Tauri v2 + React 19). Builds .dmg (macOS) and .exe/.msi (Windows) on push to `master`, creates GitHub releases with changelogs, and publishes to Homebrew Cask.

## Phases

| # | Phase | Effort | Status | File |
|---|-------|--------|--------|------|
| 1 | GitHub Actions Build & Release | 1.5h | pending | [phase-01](./phase-01-github-actions-build-release.md) |
| 2 | Changelog & Release Notes | 30m | pending | [phase-02](./phase-02-changelog-release-notes.md) |
| 3 | Homebrew Cask Distribution | 45m | pending | [phase-03](./phase-03-homebrew-cask-distribution.md) |
| 4 | README & Documentation | 15m | pending | [phase-04](./phase-04-readme-documentation.md) |

## Progress

- [ ] Phase 1: CI/CD workflow with tauri-action
- [ ] Phase 2: Release notes categories + changelog
- [ ] Phase 3: Homebrew tap repo + auto-update cask
- [ ] Phase 4: README install instructions + badges

## Key Decisions

- **Unsigned macOS builds** -- quarantine notice in release notes and cask caveats
- **tauri-apps/tauri-action@v0.5** -- official action handles build + release in one step
- **semantic-release** -- auto-bump version from conventional commits (feat→minor, fix→patch, BREAKING→major)
- **Commit filter** -- only release when feat/fix/BREAKING commits detected, not every push
- **Both macOS archs** -- aarch64 (macos-latest) + x86_64 (macos-13)
- **No Linux** -- skip for now, add later if needed
- **Conventional commits** -- enables auto-categorized release notes via `.github/release.yml`

## Dependencies

- GitHub PAT (`HOMEBREW_TAP_TOKEN`) for cross-repo cask updates
- External repo `duongductrong/homebrew-oskit` for Homebrew tap
- `semantic-release` npm package + plugins for auto version bump

## Risks

- macOS unsigned apps may be blocked by Gatekeeper; mitigated by quarantine docs
- Cross-repo token permissions must be correctly scoped
- Tauri v2 action compatibility -- pinned to v0.5
- semantic-release must update 3 version files (tauri.conf.json, Cargo.toml, package.json)

## Architecture

```
push to master
  --> .github/workflows/release.yml
       --> semantic-release (analyzes commits, bumps version, creates tag)
       --> matrix: [macos-latest, macos-13, windows-latest]
       --> tauri-apps/tauri-action@v0.5
            --> builds .dmg (aarch64 + x64) / .exe+.msi
            --> creates GitHub Release with artifacts
       --> triggers: update-homebrew-cask.yml (on release published)
            --> updates duongductrong/homebrew-oskit Casks/os-kit.rb (both archs)
```

## Validation Summary

**Validated:** 2026-02-28
**Questions asked:** 7

### Confirmed Decisions
- **GitHub owner**: `duongductrong` confirmed
- **macOS architectures**: Both aarch64 + x86_64 (dual DMGs)
- **Linux builds**: Skipped for now
- **Version management**: Auto-bump via `semantic-release` (changed from manual)
- **Release trigger**: Push to master + commit filter (only feat/fix/BREAKING trigger release)
- **Homebrew arch**: Both architectures in cask formula (on_arm/on_intel)
- **Auto-bump tool**: `semantic-release` with conventional commits

### Action Items (Plan Revisions Needed)
- [ ] **Phase 1**: Add semantic-release step before tauri-action builds. Split workflow into: (1) version-bump job → (2) build matrix job → (3) release job
- [ ] **Phase 1**: Add semantic-release config (.releaserc.json) to update tauri.conf.json, Cargo.toml, and package.json version fields
- [ ] **Phase 1**: Add commit filter — skip build if no releasable commits (feat/fix/BREAKING)
- [ ] **Phase 2**: semantic-release generates CHANGELOG.md automatically — simplify Phase 2 scope
- [ ] **package.json**: Add semantic-release + plugins as devDependencies

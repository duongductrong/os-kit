# Brainstorm: Next Features Roadmap for Oskit

**Date:** 2026-02-28
**Type:** Feature Brainstorm
**Status:** Agreed

---

## Problem Statement

Oskit is a macOS developer toolkit desktop app (Tauri + React) with tool installation manager (40+ tools via Homebrew), zshrc visual editor, and placeholder settings page. Need to determine what features to build next while prioritizing polish and completion of existing foundations.

## Current State

| Feature | Status |
|---|---|
| Tool Installation Manager | Implemented |
| Zshrc Visual Editor | Implemented |
| Settings Page | UI only, not wired |
| Persistence Layer | Missing |

## Evaluated Approaches

### Approach 1: Breadth-First (Many Small Features)
- **Pros:** App feels feature-rich quickly, more surface area for user discovery
- **Cons:** Nothing feels polished, tech debt accumulates, fragile foundation
- **Verdict:** Rejected — foundation isn't ready

### Approach 2: Killer Feature Focus (1-2 Big Bets)
- **Pros:** Differentiation, marketing story
- **Cons:** Risk of building wrong thing, ignores existing gaps
- **Verdict:** Deferred to Phase 3+

### Approach 3: Polish First, Then Layer (Recommended)
- **Pros:** Solid foundation, each new feature builds on proven patterns, fewer bugs
- **Cons:** Slower to show breadth
- **Verdict:** Selected — aligns with user priority

---

## Final Recommended Roadmap

### Phase 1: Foundation (Priority)

| Feature | Why | Complexity |
|---|---|---|
| Settings Persistence (`tauri-plugin-store`) | Blocker for all state persistence | Low |
| Wire Settings Page | Already has UI, just needs store | Low |
| Homebrew Health Check | Natural extension of install feature | Low-Med |
| Update Checker Badges | Leverages existing versionMap | Low |

### Phase 2: Config Management Hub

| Feature | Pattern | Complexity |
|---|---|---|
| Git Config Editor | Same as zshrc editor | Low |
| SSH Key Manager | Generate, list, edit ssh config | Medium |
| Hosts File Editor | Parse /etc/hosts, toggle entries | Low |

### Phase 3: Workflow Tools

| Feature | Complexity |
|---|---|
| Port Manager (lsof GUI) | Medium |
| System Info Dashboard | Low |
| Project Launcher | Medium |

### Phase 4: Polish & Delight

| Feature | Complexity |
|---|---|
| Onboarding Wizard | Medium |
| Export/Import Setup Recipe | Low |
| Disk Usage Analyzer | Medium |

---

## Explicitly Skipped (YAGNI)

| Feature | Reason |
|---|---|
| Docker Dashboard | Orbstack/Docker Desktop cover this |
| Embedded Terminal | iTerm2/Warp dominate; low ROI |
| Team Templates | Premature without user base |
| Dotfiles Git Sync | chezmoi/stow already solve this |
| Snippet Manager | Raycast/Alfred dominate this space |

---

## Architecture Considerations

- `tauri-plugin-store` must be added Phase 1 — all persistence depends on it
- Config editors (git, ssh, hosts) should share reusable parser/editor pattern extracted from zshrc editor
- Port Manager uses existing Tauri shell plugin — no new deps needed
- Hosts file editing needs sudo via `osascript` for macOS permission prompts
- Reuse feature-based folder structure for each new feature

## Risks

| Risk | Mitigation |
|---|---|
| Config file parsing edge cases | Use established parsers where possible, comprehensive backup before writes |
| Sudo elevation UX (hosts file) | Use native macOS `osascript` dialog, clear user messaging |
| Feature creep | Strict phase gating — complete one phase before starting next |
| Shared editor abstraction too early | Start with git config (simplest), extract pattern after 2nd editor |

## Success Metrics

- Phase 1: Settings persist across app restarts, outdated tool count visible on install page
- Phase 2: Users can manage git/ssh/hosts config without leaving oskit
- Phase 3: Port manager used weekly by target users
- Phase 4: New user can go from fresh macOS to dev-ready in under 10 minutes

## Next Steps

1. Implement Phase 1 starting with `tauri-plugin-store` integration
2. Wire settings page to store
3. Add `brew outdated` / `brew doctor` to installation feature
4. Plan Phase 2 config editors after Phase 1 is complete

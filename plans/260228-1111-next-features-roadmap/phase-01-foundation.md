# Phase 1: Foundation

## Context

- **Parent plan:** [plan.md](plan.md)
- **Dependencies:** None (this is the foundation)
- **Docs:** [brainstorm report](../reports/brainstorm-260228-1111-next-features-roadmap.md)

## Overview

- **Date:** 2026-02-28
- **Description:** Add settings persistence layer, wire settings page, Homebrew health check, and update badges
- **Priority:** P0 — all other phases depend on this
- **Implementation status:** Pending
- **Review status:** Pending
- **Effort:** 8h

## Key Insights

1. No persistence layer exists — settings page UI is placeholder only
2. `tauri-plugin-store` is the official Tauri v2 solution for key-value persistence
3. Homebrew health commands (`brew doctor`, `brew outdated --json`) return structured data
4. Existing `versionMap` in installation state can be extended for update checking
5. The `<Section>` UI component family is the standard layout — settings page already uses it

## Requirements

### 1.1 Settings Persistence (`tauri-plugin-store`)
- Install `tauri-plugin-store` (Rust + JS sides)
- Register plugin in `src-tauri/src/lib.rs`
- Add capability in `src-tauri/capabilities/default.json`
- Create `src/hooks/use-settings-store.ts` — shared hook for get/set/subscribe
- Create `src/contexts/settings-context.tsx` — React context wrapping the store
- Persist: theme (light/dark/system), language, font size, default open destination, sleep prevention

### 1.2 Wire Settings Page
- Connect existing `src/routes/index.tsx` UI to settings context
- **General section:** language selector, default destination dropdown, sleep prevention toggle
- **Appearance section:** theme selector (light/dark/system), font size slider, opaque background toggle
- Apply theme changes immediately via CSS variables or Tailwind dark mode
- Apply font size changes to document root

### 1.3 Homebrew Health Check
- Create `src/features/installation/components/homebrew-health.tsx`
- Create `src/hooks/use-homebrew-health.ts`
- Commands: `brew doctor`, `brew outdated --json=v2`, `brew cleanup --dry-run`
- Show: doctor warnings list, outdated packages table (name, current, latest), reclaimable disk space
- Actions: "Run cleanup" button, "Upgrade all" button, "Upgrade" per-package
- Place in installation page as collapsible section at top (after prerequisite check)
- Stream long-running commands via existing `use-tool-logs.ts` pattern

### 1.4 Update Checker Badges
- Extend `use-installation-state.ts` to run `brew outdated --json=v2` on mount
- Parse outdated JSON: `{ formulae: [{ name, installed_versions, current_version }] }`
- Create `outdatedMap: Record<string, string>` (tool ID → latest version)
- Show badge count on sidebar "Installation" nav item
- Show "Update available" indicator on individual `InstallationItem` components
- Store last-check timestamp in settings store; re-check every 24h or on manual refresh

## Architecture

### New Files
```
src/
├── contexts/
│   └── settings-context.tsx          # Settings React context + provider
├── hooks/
│   └── use-settings-store.ts         # Low-level store hook (tauri-plugin-store)
│   └── use-homebrew-health.ts        # brew doctor/outdated/cleanup
├── features/
│   └── installation/
│       └── components/
│           └── homebrew-health.tsx    # Health check UI
src-tauri/
├── Cargo.toml                        # Add tauri-plugin-store
├── src/lib.rs                        # Register store plugin
├── capabilities/default.json         # Add store:allow-* permissions
```

### Modified Files
```
src/routes/__root.tsx                 # Wrap with SettingsProvider
src/routes/index.tsx                  # Wire to settings context
src/routes/installation.tsx           # Add HombreHealth section, badge data
src/features/installation/utils/use-installation-state.ts  # Add outdatedMap
src/components/app-sidebar.tsx        # Badge on Installation nav item
src/components/nav-main.tsx           # Support badge prop rendering
```

### Settings Store Schema
```typescript
interface AppSettings {
  // General
  language: "en" | "vi";
  defaultOpenDestination: "installation" | "shell" | "settings";
  preventSleep: boolean;

  // Appearance
  theme: "light" | "dark" | "system";
  opaqueBackground: boolean;
  fontSize: number; // 12-20

  // Internal
  lastUpdateCheck: number; // timestamp
}
```

## Implementation Steps

### Step 1: Install tauri-plugin-store (30min)
1. `cd src-tauri && cargo add tauri-plugin-store`
2. `pnpm add @tauri-apps/plugin-store`
3. Register in `lib.rs`: `.plugin(tauri_plugin_store::Builder::new().build())`
4. Add permissions to `capabilities/default.json`: `"store:allow-get"`, `"store:allow-set"`, `"store:allow-save"`, `"store:allow-load"`

### Step 2: Create settings store hook + context (1.5h)
1. Create `src/hooks/use-settings-store.ts` wrapping `@tauri-apps/plugin-store`
2. Create `src/contexts/settings-context.tsx` with `SettingsProvider` + `useSettings()`
3. Default values for all settings
4. Auto-save on change (debounced)
5. Wrap `<App>` in `<SettingsProvider>` in `__root.tsx`

### Step 3: Wire settings page (2h)
1. Refactor `src/routes/index.tsx` to use `useSettings()`
2. Replace static UI with controlled inputs bound to store
3. Theme: apply `dark` class to `<html>` element, update CSS variables
4. Font size: set `--font-size` CSS variable on root
5. Test persistence across app restarts

### Step 4: Homebrew health check (2.5h)
1. Create `use-homebrew-health.ts` hook
   - `runDoctor()` → parse `brew doctor` output into warning list
   - `getOutdated()` → parse `brew outdated --json=v2` into typed array
   - `getCleanupSize()` → parse `brew cleanup --dry-run` last line for disk size
   - `runCleanup()` / `upgradeAll()` / `upgradeSingle(name)` → stream via `use-tool-logs.ts`
2. Create `homebrew-health.tsx` component
   - Collapsible `<Section>` with summary badges (warnings count, outdated count, reclaimable size)
   - Doctor warnings: list with severity icons
   - Outdated table: name, current version, latest version, "Upgrade" button
   - Cleanup: show reclaimable space + "Cleanup" button
3. Add to installation route below prerequisite section

### Step 5: Update checker badges (1.5h)
1. Extend `use-installation-state.ts` with `outdatedMap` state
2. On mount, check `lastUpdateCheck` from settings — skip if < 24h ago
3. Run `brew outdated --json=v2`, build `outdatedMap`
4. Update `lastUpdateCheck` in settings store
5. Pass outdated count to sidebar via context or prop drilling
6. Add `<Badge>` component to `nav-main.tsx` for items with badge count
7. Add "Update available: v{latest}" label to `installation-item.tsx` when outdated

## Todo List

- [ ] Install and configure tauri-plugin-store (Rust + JS + capabilities)
- [ ] Create use-settings-store.ts hook
- [ ] Create settings-context.tsx with SettingsProvider
- [ ] Wire settings page General section
- [ ] Wire settings page Appearance section (theme, font size)
- [ ] Create use-homebrew-health.ts hook
- [ ] Create homebrew-health.tsx component
- [ ] Add homebrew health to installation route
- [ ] Add outdatedMap to use-installation-state.ts
- [ ] Add badge rendering to nav-main.tsx
- [ ] Add update indicator to installation-item.tsx
- [ ] Test persistence across restarts
- [ ] Test theme switching (light/dark/system)

## Success Criteria

- Settings persist across app quit and restart
- Theme changes apply immediately without page reload
- Font size changes visible in real-time
- `brew doctor` warnings display correctly
- Outdated packages show in table with per-package upgrade
- "Cleanup" reclaims disk space and shows result
- Sidebar badge shows count of outdated tools
- Individual tool items show "update available" when outdated
- No performance regression on installation page load (<2s)

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|---|---|---|---|
| tauri-plugin-store API changes | High | Low | Pin version in Cargo.toml |
| `brew outdated --json` slow on large installs | Med | Med | Run async, cache result, show loading state |
| Theme flicker on app load | Low | Med | Read store synchronously before first render |
| Capability permissions missing | High | Low | Test in dev and prod builds |

## Security Considerations

- Settings store file lives in app data directory (OS-protected)
- No sensitive data in settings store (no passwords, API keys)
- `brew cleanup` is non-destructive (only removes cached downloads)
- Shell commands use full paths (`/opt/homebrew/bin/brew`) to avoid PATH injection

## Next Steps

After Phase 1, proceed to [Phase 2: Config Management Hub](phase-02-config-management-hub.md) — all config editors need the settings store for user preferences.

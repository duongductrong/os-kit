# Phase 4: Polish & Delight

## Context

- **Parent plan:** [plan.md](plan.md)
- **Dependencies:** Phases 1-3 (references settings store, installation state, all features)
- **Docs:** [brainstorm report](../reports/brainstorm-260228-1111-next-features-roadmap.md)

## Overview

- **Date:** 2026-02-28
- **Description:** Add onboarding wizard, export/import setup recipes, and disk usage analyzer
- **Priority:** P3
- **Implementation status:** Pending
- **Review status:** Pending
- **Effort:** 8h

## Key Insights

1. Onboarding wizard runs only once (first launch) — uses settings store to track completion
2. Export/import leverages existing YAML pattern (`installations.yaml`) + config file contents
3. Disk usage analyzer is read-only — no risk of data loss, just reporting + cleanup actions
4. These features tie together the entire app: installation + config + system info

## Requirements

### 4.1 Onboarding Wizard
- Trigger: first app launch detected via settings store (`onboardingCompleted: false`)
- Full-screen overlay or dedicated route that replaces normal UI
- Steps:
  1. **Welcome:** brief intro to oskit
  2. **System scan:** auto-detect what's already installed (reuse `use-tool-detection` for all tools in `installations.yaml`)
  3. **Results:** show installed vs missing tools with checkmarks
  4. **Starter packs:** suggest tool bundles by role:
     - "Frontend Dev" → Node.js, nvm, VS Code, git, pnpm
     - "Backend Dev" → Node.js, Python, Docker, PostgreSQL, Redis
     - "DevOps" → Docker, kubectl, terraform, awscli, gcloud
     - "Mobile Dev" → Xcode CLI, Flutter, Android Studio
  5. **Install selected:** batch install selected tools via existing installation system
  6. **Complete:** mark onboarding done, redirect to main app
- Skip button on every step
- Progress indicator (step 1/6)
- Settings: `onboardingCompleted: boolean`, `onboardingSkipped: boolean`

### 4.2 Export/Import Setup Recipe
- **Export:** serialize current setup to YAML file
  - Installed tools list (from `installations.yaml` tool IDs that pass `checkCommand`)
  - Settings (theme, IDE preference, scan directories)
  - Optionally include config file contents: `.gitconfig`, `.zshrc` sections
  - Export to user-chosen file path via Tauri dialog
- **Recipe YAML schema:**
  ```yaml
  version: 1
  exported_at: "2026-02-28T10:00:00Z"
  oskit_version: "0.1.0"
  tools:
    - id: homebrew
    - id: nvm
    - id: git
  settings:
    theme: dark
    preferredIDE: cursor
    scanDirectories: ["~/Developer"]
  configs:
    gitconfig: |
      [user]
      name = John
      email = john@example.com
  ```
- **Import:** read YAML file, show preview of what will be installed/configured
  - Diff against current state: "Already installed" vs "Will install" vs "Will configure"
  - Confirmation before execution
  - Batch install missing tools
  - Optionally apply config file contents (with backup first)
- Access from settings page or a dedicated menu action
- Use existing `yaml` npm package for serialization

### 4.3 Disk Usage Analyzer
- Route: `/disk-usage` (new file-based route)
- Categories to scan:
  - **Homebrew:** `du -sh /opt/homebrew/Cellar`, `du -sh $(brew --cache)`
  - **node_modules:** `find ~/Developer -name node_modules -type d -maxdepth 4` then `du -sh` each
  - **Docker:** `docker system df` (if Docker installed)
  - **Xcode:** `du -sh ~/Library/Developer/Xcode/DerivedData`, `du -sh ~/Library/Developer/Xcode/Archives`
  - **npm/pnpm cache:** `du -sh ~/.npm`, `du -sh ~/Library/pnpm/store`
  - **pip cache:** `du -sh ~/Library/Caches/pip`
- Display: bar chart or stacked cards showing size per category
- Total: sum of all discoverable dev-related disk usage
- Cleanup actions per category:
  - Homebrew: `brew cleanup` (already in Phase 1)
  - node_modules: delete selected directories (`rm -rf`)
  - Docker: `docker system prune -f`
  - Xcode DerivedData: `rm -rf ~/Library/Developer/Xcode/DerivedData`
  - npm cache: `npm cache clean --force`
- All cleanup actions require confirmation dialog
- Show "last scanned" timestamp, manual rescan
- Add to sidebar under "Tools" group

## Architecture

### Onboarding Feature
```
src/features/onboarding/
├── components/
│   ├── onboarding-wizard.tsx          # Full wizard container
│   ├── welcome-step.tsx               # Step 1: Welcome
│   ├── scan-step.tsx                  # Step 2: System scan
│   ├── results-step.tsx              # Step 3: Scan results
│   ├── starter-packs-step.tsx         # Step 4: Bundle selection
│   ├── install-step.tsx               # Step 5: Batch install
│   └── complete-step.tsx              # Step 6: Done
├── hooks/
│   └── use-onboarding.ts             # Wizard state, step management
└── utils/
    └── starter-packs.ts              # Bundle definitions (tool ID arrays)
```

### Export/Import Feature
```
src/features/recipe/
├── components/
│   ├── export-dialog.tsx              # Export options + file save
│   ├── import-dialog.tsx              # File select + preview + confirm
│   └── recipe-diff-view.tsx           # Show what will change
├── hooks/
│   └── use-recipe.ts                  # Export/import logic
└── utils/
    ├── serialize-recipe.ts            # Build recipe YAML from current state
    └── parse-recipe.ts                # Parse recipe YAML + validate
```

### Disk Usage Feature
```
src/features/disk-usage/
├── components/
│   ├── disk-analyzer.tsx              # Top-level dashboard
│   ├── usage-category-card.tsx        # Per-category card with size + cleanup
│   ├── node-modules-list.tsx          # Expandable list of node_modules dirs
│   └── cleanup-dialog.tsx             # Cleanup confirmation
├── hooks/
│   └── use-disk-usage.ts             # Scan commands + aggregation
└── utils/
    └── parse-du-output.ts            # Parse du/docker output
```

### New Routes
```
src/routes/
└── disk-usage.tsx                     # /disk-usage route
```

### Modified Files
```
src/routes/__root.tsx                  # Conditionally show onboarding overlay
src/routes/index.tsx                   # Add export/import buttons to settings
src/components/app-sidebar.tsx         # Add Disk Usage nav item
src/contexts/settings-context.tsx      # Add onboardingCompleted, onboardingSkipped
```

## Related Code Files

| File | Relevance |
|---|---|
| `src/features/installation/utils/use-installation-state.ts` | Reuse for batch install in onboarding |
| `src/features/installation/utils/installation-data.ts` | Tool definitions for scanning |
| `src/config/installations.yaml` | Tool IDs for recipe export |
| `src/hooks/use-tool-detection.ts` | Check installed status during scan |
| `src/contexts/settings-context.tsx` | Onboarding flag + settings for export |

## Implementation Steps

### Step 1: Onboarding Wizard (3h)
1. Add `onboardingCompleted` and `onboardingSkipped` to settings schema
2. Create `starter-packs.ts` with bundle definitions (arrays of tool IDs from `installations.yaml`)
3. Create `use-onboarding.ts`:
   - `currentStep` state (1-6)
   - `scanResults` from `use-tool-detection` run against all tools
   - `selectedTools` from starter pack selection
   - `next()`, `prev()`, `skip()`, `complete()` actions
4. Create step components:
   - `welcome-step.tsx` — branding, intro text, "Get Started" button
   - `scan-step.tsx` — progress bar while scanning, reuse existing detection hooks
   - `results-step.tsx` — two-column: installed (green check) vs missing (gray)
   - `starter-packs-step.tsx` — selectable cards per bundle, custom selection option
   - `install-step.tsx` — progress for each tool, reuse installation state callbacks
   - `complete-step.tsx` — success message, "Go to App" button
5. Create `onboarding-wizard.tsx` — step container with progress indicator
6. In `__root.tsx`: if `!onboardingCompleted && !onboardingSkipped`, render wizard overlay

### Step 2: Export/Import Recipe (2.5h)
1. Create `serialize-recipe.ts`:
   - Scan all tools from `installations.yaml`, check which are installed
   - Read current settings from store
   - Optionally read config files (`.gitconfig`, `.zshrc`)
   - Build YAML string
2. Create `parse-recipe.ts`:
   - Parse YAML, validate against schema
   - Return typed `Recipe` object
3. Create `use-recipe.ts`:
   - `exportRecipe(options)` → build YAML, save via Tauri file dialog
   - `importRecipe(filePath)` → parse, diff against current, return preview
   - `applyRecipe(recipe)` → batch install + apply configs
4. Create `export-dialog.tsx` — checkboxes for what to include, "Export" button
5. Create `import-dialog.tsx` — file picker, preview table, "Apply" button
6. Create `recipe-diff-view.tsx` — color-coded diff (green=install, yellow=configure, gray=skip)
7. Add export/import buttons to settings page

### Step 3: Disk Usage Analyzer (2.5h)
1. Create `parse-du-output.ts`:
   - Parse `du -sh` output: extract size string + path
   - Parse `docker system df` output: type, total, active, size, reclaimable
2. Create `use-disk-usage.ts`:
   - Run all category scans in parallel
   - Return `{ category, size, sizeBytes, items?, cleanupCommand }[]`
   - `cleanup(category)` → run cleanup command with streaming log
   - Loading state per category
3. Create `usage-category-card.tsx` — category name, size badge, progress bar relative to total, cleanup button
4. Create `node-modules-list.tsx` — expandable list of found node_modules with individual sizes + delete
5. Create `cleanup-dialog.tsx` — confirmation with what will be deleted
6. Create `disk-analyzer.tsx` — grid of category cards + total summary
7. Create `src/routes/disk-usage.tsx`
8. Add to sidebar under "Tools" group

## Todo List

- [ ] Add onboarding flags to settings schema
- [ ] Create starter-packs.ts bundle definitions
- [ ] Create use-onboarding.ts hook
- [ ] Create all 6 onboarding step components
- [ ] Create onboarding-wizard.tsx container
- [ ] Wire onboarding into __root.tsx
- [ ] Create serialize-recipe.ts and parse-recipe.ts
- [ ] Create use-recipe.ts hook
- [ ] Create export and import dialog components
- [ ] Add export/import buttons to settings page
- [ ] Create parse-du-output.ts
- [ ] Create use-disk-usage.ts hook
- [ ] Create disk analyzer components
- [ ] Create /disk-usage route
- [ ] Add Disk Usage to sidebar
- [ ] Test onboarding flow end-to-end
- [ ] Test recipe export → import round-trip
- [ ] Test disk cleanup actions with confirmation

## Success Criteria

- Onboarding: wizard shows on first launch, not on subsequent launches
- Onboarding: skip button works at any step, marks as skipped
- Onboarding: system scan correctly identifies installed/missing tools
- Onboarding: starter pack install triggers actual tool installation
- Recipe export: produces valid YAML matching schema
- Recipe import: correctly diffs against current state
- Recipe import: installs missing tools, applies configs (with backup)
- Disk usage: shows sizes for all categories that exist on system
- Disk usage: cleanup actions reclaim space, size updates after cleanup
- Disk usage: node_modules list allows individual directory deletion

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|---|---|---|---|
| Onboarding scan takes too long (40+ tools) | Med | Med | Run in parallel batches of 5, show progress per tool |
| Recipe format versioning | Low | Low | Version field in YAML, backward-compatible parsing |
| `find` for node_modules very slow on large disks | Med | High | Limit search to scan directories only, not root `/` |
| Docker not running when scanning | Low | High | Check Docker availability first, skip with "Docker not running" message |
| Cleanup deletes something user wants | High | Low | Confirmation dialog with exact paths, no auto-cleanup |

## Security Considerations

- Recipe export: warn user if config files contain sensitive data (SSH keys, tokens)
- Recipe import: validate YAML structure before processing, reject malformed files
- Disk cleanup: `rm -rf` only on confirmed paths matching expected patterns (no arbitrary deletion)
- node_modules scan: only within user-specified directories, not system paths
- Docker prune: uses `-f` flag but with prior confirmation dialog

## Next Steps

Phase 4 completes the roadmap. Post-roadmap considerations:
- Gather user feedback on feature usage
- Performance profiling and optimization
- Consider community feature requests
- Evaluate need for automatic update checking (background service)

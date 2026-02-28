# Phase 3: Workflow Tools

## Context

- **Parent plan:** [plan.md](plan.md)
- **Dependencies:** Phase 1 (settings store for preferences)
- **Docs:** [brainstorm report](../reports/brainstorm-260228-1111-next-features-roadmap.md)

## Overview

- **Date:** 2026-02-28
- **Description:** Build port manager, system info dashboard, and project launcher — daily-use developer tools
- **Priority:** P2
- **Implementation status:** Pending
- **Review status:** Pending
- **Effort:** 12h

## Key Insights

1. Port manager is a frequent dev pain point — `lsof -i -P -n` returns structured output parseable by regex
2. System info is low-complexity, high-impact — several one-off shell commands displayed in a dashboard
3. Project launcher has medium complexity — needs directory scanning + project type detection + IDE open
4. All three use existing `tauri-plugin-shell` — no new Rust dependencies needed
5. Port manager needs refresh mechanism (manual + optional auto-refresh stored in settings)

## Requirements

### 3.1 Port Manager
- Route: `/ports` (new file-based route)
- Run `lsof -i -P -n -sTCP:LISTEN` to get listening ports
- Parse output into: PID, process name, user, port, protocol, local address
- Display as sortable table
- Actions per row:
  - Kill process: `kill -9 {PID}` with confirmation dialog
  - Copy port number
  - Open in browser: `http://localhost:{port}` via Tauri opener
- Manual refresh button + optional auto-refresh interval (5s/10s/30s, stored in settings)
- Filter by port number or process name

### 3.2 System Info Dashboard
- Route: `/system` (new file-based route)
- Data cards:
  - **macOS:** version (`sw_vers -productVersion`), build (`sw_vers -buildVersion`), arch
  - **CPU:** name (`sysctl -n machdep.cpu.brand_string`), cores (`sysctl -n hw.ncpu`)
  - **Memory:** total (`sysctl -n hw.memsize` → format to GB)
  - **Disk:** total, used, available (`df -h /` → parse)
  - **Xcode CLI:** installed status (`xcode-select -p`), version (`pkgutil --pkg-info=com.apple.pkg.CLTools_Executables`)
  - **Shell:** `$SHELL`, version (`$SHELL --version`)
  - **Homebrew:** version, prefix, package count (`brew list | wc -l`)
  - **Node.js:** version if installed (`node -v`)
  - **Git:** version (`git --version`)
- Layout: responsive grid of info cards
- One-time load on route enter, manual refresh button
- Actions: "Install Xcode CLI" button if not detected (`xcode-select --install`)

### 3.3 Project Launcher
- Route: `/projects` (new file-based route)
- Settings (stored in settings store):
  - `scanDirectories: string[]` — directories to scan (default: `~/Developer`, `~/Projects`)
  - `preferredIDE: string` — default IDE for opening (VS Code, Cursor, WebStorm, etc.)
  - `scanDepth: number` — how deep to scan (default: 2)
- Scan logic: find directories containing project marker files within scan depth
- Project markers & types:
  - `package.json` → Node.js (check `dependencies` for React/Next/Vue hints)
  - `Cargo.toml` → Rust
  - `go.mod` → Go
  - `pyproject.toml` or `requirements.txt` → Python
  - `Gemfile` → Ruby
  - `pom.xml` or `build.gradle` → Java
  - `.xcodeproj` or `.xcworkspace` → Xcode/Swift
- Display: project cards with name, type icon, path, last modified, detected IDE config
- Actions per project:
  - Open in IDE: `code {path}`, `cursor {path}`, etc.
  - Open in Terminal: `open -a Terminal {path}`
  - Open in Finder: `open {path}`
  - Copy path
- Search/filter by name or type
- Store scan results in memory (not persisted), re-scan on button press
- Settings panel: manage scan directories and preferred IDE

## Architecture

### Port Manager Feature
```
src/features/ports/
├── components/
│   ├── port-manager.tsx               # Top-level component
│   ├── port-table.tsx                 # Sortable port list table
│   └── port-kill-dialog.tsx           # Kill confirmation dialog
├── hooks/
│   └── use-port-scanner.ts            # lsof parsing + kill + refresh
└── utils/
    └── parse-lsof.ts                  # Parse lsof output into typed array
```

### System Info Feature
```
src/features/system-info/
├── components/
│   ├── system-dashboard.tsx           # Top-level dashboard layout
│   ├── info-card.tsx                  # Reusable info card component
│   └── xcode-install-button.tsx       # Conditional Xcode CLI install
├── hooks/
│   └── use-system-info.ts            # Run all system commands, aggregate
└── utils/
    └── parse-system-commands.ts       # Parse command outputs
```

### Project Launcher Feature
```
src/features/projects/
├── components/
│   ├── project-launcher.tsx           # Top-level component
│   ├── project-card.tsx               # Individual project card
│   ├── project-search.tsx             # Search/filter bar
│   └── scan-settings-panel.tsx        # Scan directories config
├── hooks/
│   └── use-project-scanner.ts         # Directory scan + project detection
└── utils/
    ├── detect-project-type.ts         # Marker file → project type mapping
    └── scan-directories.ts            # Recursive directory scanning
```

### New Routes
```
src/routes/
├── ports.tsx                          # /ports route
├── system.tsx                         # /system route
└── projects.tsx                       # /projects route
```

### Modified Files
```
src/components/app-sidebar.tsx         # Add Ports, System, Projects nav items
src/contexts/settings-context.tsx      # Add scanDirectories, preferredIDE, scanDepth, autoRefreshInterval
```

## Related Code Files

| File | Relevance |
|---|---|
| `src/hooks/use-tool-detection.ts` | Shell command execution pattern |
| `src/hooks/use-tool-logs.ts` | Streaming command output |
| `src/components/ui/section.tsx` | Layout primitive |
| `src/components/ui/card.tsx` | Card component for dashboard |
| `src/contexts/settings-context.tsx` | Scan dirs + IDE preference storage |

## Implementation Steps

### Step 1: Port Manager (4h)
1. Create `parse-lsof.ts`:
   - Run `lsof -i -P -n -sTCP:LISTEN`
   - Parse each line: COMMAND, PID, USER, FD, TYPE, DEVICE, SIZE/OFF, NODE, NAME
   - Extract port from NAME field (`*:{port}` or `127.0.0.1:{port}`)
   - Return `{ pid: number, process: string, user: string, port: number, address: string }[]`
2. Create `use-port-scanner.ts`:
   - `scanPorts(): Promise<PortEntry[]>` — run lsof, parse results
   - `killProcess(pid: number): Promise<void>` — `kill -9 {pid}`
   - `autoRefresh: boolean` + `refreshInterval` state from settings
   - `useEffect` with interval for auto-refresh
3. Create `port-kill-dialog.tsx` — AlertDialog with process name + PID
4. Create `port-table.tsx` — sortable table (by port, process, PID)
5. Create `port-manager.tsx` — assembles table + search + refresh controls
6. Create `src/routes/ports.tsx`
7. Add to sidebar under new "Tools" group

### Step 2: System Info Dashboard (3h)
1. Create `use-system-info.ts`:
   - Run ~10 shell commands in parallel via `Promise.all`
   - Parse each output into typed fields
   - Return `SystemInfo` object with all fields
   - Loading/error states
2. Create `info-card.tsx` — reusable card: icon, label, value, optional action button
3. Create `xcode-install-button.tsx` — conditional button if Xcode CLI not detected
4. Create `system-dashboard.tsx` — responsive grid of info cards
5. Create `src/routes/system.tsx`
6. Add to sidebar under "Tools" group

### Step 3: Project Launcher (5h)
1. Create settings fields: `scanDirectories`, `preferredIDE`, `scanDepth` in settings context
2. Create `detect-project-type.ts`:
   - Map marker files to project types with icons
   - Check for IDE-specific dirs (`.vscode/`, `.idea/`)
3. Create `scan-directories.ts`:
   - Use `ls` and `test -f` commands via Tauri shell to check marker files
   - Recursive scan with depth limit
   - Return `{ name, path, type, ideConfig, lastModified }[]`
4. Create `use-project-scanner.ts`:
   - `scan(): Promise<Project[]>` — iterate scan dirs, detect types
   - `openInIDE(path, ide)` — shell command to open
   - `openInTerminal(path)` — `open -a Terminal {path}`
   - `openInFinder(path)` — `open {path}`
5. Create `project-card.tsx` — card with type icon, name, path, action buttons
6. Create `project-search.tsx` — filter by name or type
7. Create `scan-settings-panel.tsx` — manage scan directories list + IDE selector
8. Create `project-launcher.tsx` — assembles search + settings + project grid
9. Create `src/routes/projects.tsx`
10. Add to sidebar under "Tools" group

## Todo List

- [ ] Create parse-lsof.ts utility
- [ ] Create use-port-scanner.ts hook
- [ ] Create port manager components (table, kill dialog)
- [ ] Create /ports route
- [ ] Create use-system-info.ts hook
- [ ] Create system dashboard components (info cards, xcode button)
- [ ] Create /system route
- [ ] Add scan settings to settings context
- [ ] Create detect-project-type.ts and scan-directories.ts utils
- [ ] Create use-project-scanner.ts hook
- [ ] Create project launcher components (cards, search, settings panel)
- [ ] Create /projects route
- [ ] Add Ports, System, Projects to sidebar navigation
- [ ] Test port kill with confirmation
- [ ] Test project detection across different project types
- [ ] Test scan directory settings persistence

## Success Criteria

- Port manager: shows all listening ports, killable with confirmation, table refreshes
- Port manager: auto-refresh works at configured interval
- System info: all cards populated with correct data
- System info: "Install Xcode CLI" button works when CLI not detected
- Project launcher: correctly detects Node.js, Rust, Go, Python projects in scan dirs
- Project launcher: opens projects in selected IDE
- Project launcher: scan directories configurable, persisted in settings
- All routes accessible from sidebar, correct navigation

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|---|---|---|---|
| `lsof` output format varies by macOS version | Med | Low | Test on macOS 13+, add fallback parsing |
| Project scan slow on large directories | Med | Med | Limit scan depth, show loading indicator, scan in background |
| IDE not installed (e.g., `code` not in PATH) | Low | Med | Check command availability before showing, graceful error |
| Kill process kills wrong thing | High | Low | Show full process info in confirmation, use `kill` (not `kill -9`) first |
| Permission denied on lsof for some processes | Low | Med | Show "N/A" for inaccessible fields, run with current user privileges |

## Security Considerations

- `kill` command only on user-confirmed PIDs — never batch kill
- Project paths displayed but not executed — only passed to known IDE commands
- `lsof` runs as current user — cannot see root processes (acceptable)
- Scan directories validated as existing paths before scanning
- IDE open commands use safe shell invocation (no interpolation in path)

## Next Steps

After Phase 3, proceed to [Phase 4: Polish & Delight](phase-04-polish-and-delight.md).

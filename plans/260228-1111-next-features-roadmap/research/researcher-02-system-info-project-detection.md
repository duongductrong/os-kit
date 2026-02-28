# Research: System Info & Project Detection (Tauri v2 / macOS)
Date: 2026-02-28

---

## 1. macOS System Information Commands

### `sw_vers` — OS Version
```sh
sw_vers
# ProductName:    macOS
# ProductVersion: 26.2
# BuildVersion:   25C56
```
Parse: split on `\t`, take index 1 of each line.

### `sysctl` — CPU / RAM
```sh
sysctl hw.ncpu hw.memsize machdep.cpu.brand_string
# hw.ncpu: 10
# hw.memsize: 34359738368      # bytes → divide by 1073741824 for GB
# machdep.cpu.brand_string: Apple M1 Pro
```
Single call, parse `key: value` pairs. `hw.memsize` is bytes.

### `df -h` — Disk Usage
```sh
df -h /
# Filesystem   Size  Used  Avail Capacity ...
# /dev/disk3s1 926Gi 15Gi  216Gi 7% ...
```
For machine-readable output prefer `df -k /` (kilobytes, no suffix ambiguity).

### Xcode CLI Tools
```sh
xcode-select -p          # returns path if installed, exit code 0
# /Applications/Xcode.app/Contents/Developer
xcode-select --install   # triggers install prompt (side effect, avoid in app)
```
Detection strategy: run `xcode-select -p`, check exit code. Non-zero = not installed.

### Shell Version
```sh
$SHELL --version
# zsh 5.9 (arm64-apple-darwin25.0)
# bash --version → GNU bash, version 3.2.57...
```
Parse first line; shell path from `$SHELL` env var.

**Tauri v2 integration:** use `Command::new("sw_vers").output()` via `tauri::api::process` or the `shell` plugin. All commands are sync-safe via `tauri::async_runtime::spawn_blocking`.

---

## 2. Project Type Detection

### Marker Files by Ecosystem
| Ecosystem | Marker Files |
|-----------|-------------|
| Node.js | `package.json`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml` |
| Rust | `Cargo.toml`, `Cargo.lock` |
| Go | `go.mod`, `go.sum` |
| Python | `pyproject.toml`, `setup.py`, `requirements.txt`, `Pipfile` |
| Ruby | `Gemfile`, `Gemfile.lock` |
| Java/Kotlin | `pom.xml`, `build.gradle`, `build.gradle.kts`, `settings.gradle` |
| PHP | `composer.json` |
| Swift/Xcode | `Package.swift`, `*.xcodeproj`, `*.xcworkspace` |
| Elixir | `mix.exs` |
| .NET | `*.csproj`, `*.sln`, `*.fsproj` |

### Efficient Scanning Strategy
- Use Rust `std::fs::read_dir` (single level, non-recursive) on project root — O(n) where n = entries in root dir.
- Check for marker file existence with `Path::exists()` — no file read needed.
- Limit scan depth to 1–2 levels; avoid full recursive walk for detection (use recursive only for `node_modules` cleanup).
- Priority order: check most common first (`package.json` → `Cargo.toml` → `go.mod` → `pyproject.toml`).
- Single pass: collect all present markers, return array of detected types.

### IDE Preference Detection
```
.vscode/       → VS Code
.idea/         → JetBrains IDEs
.cursor/       → Cursor
.zed/          → Zed
*.code-workspace → VS Code workspace
```
Check for directory existence at project root. Return first match or array of all found.

---

## 3. Homebrew Health & Update Commands

### `brew doctor`
```sh
brew doctor
# Output: plain text warnings, one per paragraph
# Exit code 0 = healthy, 1 = warnings present
```
Parse strategy: split on `\n\n`, filter lines starting with `Warning:`. No JSON flag available.

### `brew outdated --json`
```sh
brew outdated --json=v2
```
```json
{
  "formulae": [
    {
      "name": "abseil",
      "installed_versions": ["20250814.1"],
      "current_version": "20260107.1",
      "pinned": false,
      "pinned_version": null
    }
  ],
  "casks": []
}
```
Use `--json=v2` for structured output. Fields: `name`, `installed_versions[]`, `current_version`, `pinned`.

### `brew cleanup --dry-run`
```sh
brew cleanup --dry-run
# Would remove: /opt/homebrew/Cellar/gettext/0.26_1 (2,428 files, 29.6MB)
# Would remove: /Users/.../Caches/Homebrew/gettext--0.26_1 (9.6MB)
```
Parse with regex: `Would remove: (.+) \((.+)\)`. Sum sizes for total reclaimable space.

### `brew info --json=v2 <formula>`
```sh
brew info --json=v2 node
# Returns full metadata: versions, dependencies, bottle info, caveats
```
For bulk info: `brew info --json=v2 --installed` (all installed packages).

---

## 4. Disk Usage Analysis on macOS

### node_modules Recursive Search
```sh
find ~ -name "node_modules" -type d -prune -maxdepth 8 2>/dev/null
```
`-prune` prevents descending into found `node_modules` (avoids nested duplicates). Combine with `du -sk` per result:
```sh
du -sk path/to/node_modules
# 1234567  path/to/node_modules   (kilobytes)
```
In Rust: use `walkdir` crate with `filter_entry` to prune at `node_modules`.

### Docker Disk Usage
```sh
docker system df
# TYPE        TOTAL  ACTIVE  SIZE      RECLAIMABLE
# Images      16     13      12.82GB   3.524GB (27%)
# Containers  15     1       288.7MB   288.4MB (99%)
# Local Volumes 13   12      2.11GB    40.56MB (1%)
# Build Cache 5      0       0B        0B
```
Tab-separated. Parse columns: TYPE, TOTAL, ACTIVE, SIZE, RECLAIMABLE. Check if Docker daemon running first (`docker info 2>&1`).

### Xcode Caches
| Path | Typical Size |
|------|-------------|
| `~/Library/Developer/Xcode/DerivedData/` | 1–20+ GB |
| `~/Library/Developer/Xcode/Archives/` | variable |
| `~/Library/Developer/CoreSimulator/Devices/` | 5–30 GB |
| `~/Library/Caches/com.apple.dt.Xcode/` | 1–5 GB |

```sh
du -sh ~/Library/Developer/Xcode/DerivedData
# 11G  ~/Library/Developer/Xcode/DerivedData
```

### Homebrew Cache
```sh
du -sh ~/Library/Caches/Homebrew
# 2.4G  ~/Library/Caches/Homebrew
brew --cache   # prints cache path (respects HOMEBREW_CACHE env var)
```

### `du` Patterns Summary
```sh
du -sh <path>          # human-readable summary
du -sk <path>          # kilobytes, machine-parseable
du -sk * | sort -rn    # sorted by size descending
du -sh ~/Library/Developer/Xcode/DerivedData
du -sh ~/Library/Caches/Homebrew
```

---

## Tauri v2 Integration Notes

- All shell commands: use `tauri-plugin-shell` with allowlist in `tauri.conf.json`
- Async execution: `invoke` from frontend, Rust handler uses `tokio::process::Command`
- For large directory scans (`find`, `du`): stream output via Tauri events to avoid timeout
- `docker` commands: check binary existence first (`which docker`)
- Cache paths: use `dirs` crate for `home_dir()` instead of hardcoding `~`

---

## Unresolved Questions

1. Should `find` for node_modules use a configurable depth limit (user-settable) or fixed max?
2. Docker detection — handle Docker Desktop vs CLI-only installs differently?
3. `brew doctor` parsing — sufficient to show raw warning text or need structured categories?
4. For project detection scan: should the app watch directories for changes (FSEvents) or only on-demand?

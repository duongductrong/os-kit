# Phase 1: GitHub Actions Build & Release

## Context

- **Parent Plan**: [plan.md](./plan.md)
- **Dependencies**: None (first phase)
- **Docs**: [Tauri v2 CI/CD](https://v2.tauri.app/distribute/ci-cd/), [tauri-action](https://github.com/tauri-apps/tauri-action)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-02-28 |
| Priority | P1 |
| Effort | 1.5h |
| Implementation Status | Not started |
| Review Status | Pending |

Create `.github/workflows/release.yml` that triggers on push to `master`, builds Tauri app for macOS (.dmg) and Windows (.exe/.msi), and auto-creates a GitHub Release with all artifacts attached.

## Key Insights

- `tauri-apps/tauri-action@v0.5` handles build + release creation in a single step
- When no `APPLE_CERTIFICATE` env vars are set, signing is skipped gracefully
- The action reads version from `src-tauri/tauri.conf.json` automatically via `__VERSION__` placeholder
- pnpm must be enabled via `corepack enable` or installed explicitly before `actions/setup-node`
- macOS runner (`macos-latest`) provides both aarch64 (Apple Silicon) builds; x86_64 requires `macos-13`
- Windows runner (`windows-latest`) provides x86_64 builds

## Requirements

1. Trigger on push to `master` branch
2. Build .dmg for macOS (Apple Silicon — aarch64)
3. Build .exe and .msi for Windows (x86_64)
4. Auto-create GitHub Release tagged `v{version}` with artifacts
5. Skip macOS code signing (no Apple Developer account)
6. Use pnpm as package manager
7. Cache Rust and Node dependencies for faster builds

## Architecture

```
push to master
  └─> release.yml
       ├─> create-release (job 1): create draft GitHub release, output release_id
       └─> build (job 2, matrix):
            ├─> macos-latest (aarch64): .dmg
            └─> windows-latest (x64): .exe, .msi
            └─> tauri-action uploads artifacts to release
```

**Decision**: Use a single `build-and-release` job with matrix strategy. The `tauri-action` handles release creation idempotently — first matrix job creates the release, subsequent ones attach to it.

## Related Code Files

| File | Purpose |
|------|---------|
| `src-tauri/tauri.conf.json` | App version (0.1.0), bundle config, product name |
| `src-tauri/Cargo.toml` | Rust dependencies, app metadata |
| `package.json` | Node deps, pnpm scripts (`build`: `tsc && vite build`) |
| `.github/workflows/release.yml` | **TO CREATE** — main CI/CD workflow |

## Implementation Steps

### Step 1: Create workflow directory

```bash
mkdir -p .github/workflows
```

### Step 2: Create `.github/workflows/release.yml`

```yaml
name: Release

on:
  push:
    branches:
      - master
  workflow_dispatch:

permissions:
  contents: write

jobs:
  build-and-release:
    strategy:
      fail-fast: false
      matrix:
        include:
          - platform: macos-latest
            args: --target aarch64-apple-darwin
          - platform: macos-13
            args: --target x86_64-apple-darwin
          - platform: windows-latest
            args: ""

    runs-on: ${{ matrix.platform }}

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Install Rust stable
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: ${{ matrix.platform == 'macos-latest' && 'aarch64-apple-darwin' || matrix.platform == 'macos-13' && 'x86_64-apple-darwin' || '' }}

      - name: Rust cache
        uses: swatinem/rust-cache@v2
        with:
          workspaces: "./src-tauri -> target"

      - name: Install pnpm
        uses: pnpm/action-setup@v4
        with:
          version: latest

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install frontend dependencies
        run: pnpm install

      - name: Build and release Tauri app
        uses: tauri-apps/tauri-action@v0.5
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tagName: v__VERSION__
          releaseName: "OS Kit v__VERSION__"
          releaseBody: |
            See the assets below to download and install OS Kit.

            **macOS users**: This app is not signed with an Apple Developer certificate. After installing, run:
            ```
            sudo xattr -rd com.apple.quarantine /Applications/OS\ Kit.app
            ```
          releaseDraft: false
          prerelease: false
          args: ${{ matrix.args }}
```

### Step 3: Verify tauri.conf.json bundle config

Confirm `src-tauri/tauri.conf.json` has `"targets": "all"` and icons configured. Current config is correct -- no changes needed.

### Step 4: Add Rust target for cross-compilation (if needed)

The workflow handles this via `dtolnay/rust-toolchain` `targets` input. No local changes needed.

### Step 5: Test the workflow

Push to `master` and monitor the Actions tab. Verify:
- Both macOS and Windows jobs run
- Artifacts (.dmg, .exe, .msi) are attached to the release
- Release is tagged `v0.1.0`
- Release body contains quarantine instructions

## Todo

- [ ] Create `.github/workflows` directory
- [ ] Create `release.yml` workflow file
- [ ] Verify tauri.conf.json bundle config is correct
- [ ] Push to master and verify workflow runs
- [ ] Confirm release is created with correct tag, name, and artifacts
- [ ] Verify macOS .dmg and Windows .exe/.msi are attached

## Success Criteria

1. Workflow triggers on push to `master`
2. macOS job produces `.dmg` file (aarch64)
3. Windows job produces `.exe` and `.msi` files (x86_64)
4. GitHub Release auto-created with tag `v0.1.0`
5. All artifacts attached to the release
6. Release body contains unsigned app warning

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| macOS build fails due to missing deps | High | Low | Tauri v2 has minimal macOS deps; runner has Xcode pre-installed |
| tauri-action version incompatibility | High | Low | Pinned to v0.5; tested with Tauri v2 |
| pnpm cache miss slows builds | Low | Medium | `swatinem/rust-cache` + `actions/setup-node` cache |
| Race condition: multiple matrix jobs creating same release | Medium | Low | tauri-action handles idempotent release creation |

## Security Considerations

- `GITHUB_TOKEN` is auto-provided with `contents: write` permission -- no manual secret needed
- No code signing secrets stored (unsigned builds)
- Workflow only triggers on `master` branch, not PRs from forks
- `workflow_dispatch` allows manual re-runs for debugging

## Next Steps

- Proceed to [Phase 2](./phase-02-changelog-release-notes.md) for release notes categorization
- After Phase 3, the Homebrew update workflow will trigger on `release: published` events from this workflow

# Phase 4: README & Documentation

## Context

- **Parent Plan**: [plan.md](./plan.md)
- **Dependencies**: [Phase 1](./phase-01-github-actions-build-release.md), [Phase 3](./phase-03-homebrew-cask-distribution.md)
- **Docs**: Existing `README.md` (minimal -- template boilerplate)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-02-28 |
| Priority | P2 |
| Effort | 15m |
| Implementation Status | Not started |
| Review Status | Pending |

Update README.md with installation instructions (Homebrew, direct download, quarantine bypass), CI status badges, and contributor acknowledgment section.

## Key Insights

- Current README is template boilerplate -- needs complete rewrite for end-user focus
- GitHub badges use shields.io or GitHub's built-in badge URLs
- Quarantine bypass instructions are critical -- must be prominent
- Contributing section should mention conventional commits for changelog attribution

## Requirements

1. Installation section: Homebrew tap, direct download, quarantine bypass
2. CI/CD status badge
3. Latest release badge
4. Contributing guidelines mentioning conventional commits
5. Contributors section or acknowledgment

## Related Code Files

| File | Purpose |
|------|---------|
| `README.md` | **TO UPDATE** -- main project README |

## Implementation Steps

### Step 1: Rewrite `README.md`

Replace current template content with:

```markdown
# OS Kit

[![Release](https://github.com/duongductrong/oskit/actions/workflows/release.yml/badge.svg)](https://github.com/duongductrong/oskit/actions/workflows/release.yml)
[![Latest Release](https://img.shields.io/github/v/release/duongductrong/oskit)](https://github.com/duongductrong/oskit/releases/latest)

A desktop toolkit application built with Tauri v2, React, and TypeScript.

## Installation

### Homebrew (macOS)

```bash
brew tap duongductrong/oskit
brew install --cask os-kit
```

### Direct Download

Download the latest installer from the [Releases page](https://github.com/duongductrong/oskit/releases/latest):

| Platform | Architecture | File |
|----------|-------------|------|
| macOS | Apple Silicon (M1/M2/M3) | `.dmg` (aarch64) |
| macOS | Intel | `.dmg` (x64) |
| Windows | x86_64 | `.exe` / `.msi` |

### macOS Unsigned App Notice

OS Kit is not currently signed with an Apple Developer certificate. macOS Gatekeeper may block the app on first launch.

**To bypass this**, open Terminal and run:

```bash
sudo xattr -rd com.apple.quarantine /Applications/OS\ Kit.app
```

Or right-click the app in Finder and select **Open** to allow it.

## Development

### Prerequisites

- [Rust](https://rustup.rs/) (stable)
- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/)

### Setup

```bash
pnpm install
pnpm tauri dev
```

### Build

```bash
pnpm tauri build
```

## Contributing

Contributions are welcome! Please use [conventional commits](https://www.conventionalcommits.org/) for your commit messages:

- `feat: add new feature` -- appears under "New Features" in release notes
- `fix: resolve bug` -- appears under "Bug Fixes"
- `chore: update dependencies` -- appears under "Maintenance"

Contributors are automatically credited in each release's notes.

## Contributors

Thanks to all contributors who help improve OS Kit.

<!-- Contributors will be auto-listed via GitHub's release notes -->

## License

[MIT](LICENSE)
```

### Step 2: Verify badge URLs

After Phase 1 workflow is created, confirm:
- `release.yml` badge URL matches actual workflow file name
- Release badge shows correct version after first release

## Todo

- [ ] Rewrite README.md with installation instructions
- [ ] Add CI status and release badges
- [ ] Add macOS quarantine bypass instructions (prominent)
- [ ] Add contributing guidelines with conventional commit format
- [ ] Verify badges render correctly after first release

## Success Criteria

1. README contains clear Homebrew installation instructions
2. Direct download links point to GitHub releases
3. Quarantine bypass instructions are prominent and accurate
4. CI badge shows build status
5. Release badge shows latest version
6. Contributing section mentions conventional commits

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Badge URLs incorrect before first release | Low | Medium | Badges gracefully show "no status" until workflow runs |
| DMG filename in table may not match actual | Low | Medium | Use generic descriptions, link to releases page |

## Security Considerations

- No secrets or sensitive information in README
- Download links point to official GitHub releases only
- Quarantine bypass command is safe and well-documented by Apple

## Next Steps

- After all phases complete, do a test release cycle: push to master, verify build, release, cask update, and README badges
- Consider adding a `CONTRIBUTING.md` for more detailed contribution guidelines (future enhancement)

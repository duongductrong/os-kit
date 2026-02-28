# OS Kit

[![Release](https://github.com/duongductrong/os-kit/actions/workflows/release.yml/badge.svg)](https://github.com/duongductrong/os-kit/actions/workflows/release.yml)
[![Latest Release](https://img.shields.io/github/v/release/duongductrong/os-kit)](https://github.com/duongductrong/os-kit/releases/latest)

A desktop toolkit application built with Tauri v2, React, and TypeScript.

## Installation

### Homebrew (macOS)

```bash
brew tap duongductrong/oskit
brew install --cask os-kit
```

### Direct Download

Download the latest installer from the [Releases page](https://github.com/duongductrong/os-kit/releases/latest):

| Platform | Architecture | File |
|----------|-------------|------|
| macOS | Apple Silicon (M1/M2/M3/M4) | `.dmg` (aarch64) |
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

- `release: bundle v1.1 features` — **triggers a new release build**
- `release!: breaking API change` — triggers a **major** release
- `feat: add new feature` — normal commit (no release)
- `fix: resolve bug` — normal commit (no release)
- `chore: update dependencies` — normal commit (no release)

Only commits with the `release:` type trigger the CI/CD build and publish pipeline. Contributors are automatically credited in each release's notes.

## Contributors

Thanks to all contributors who help improve OS Kit.

## License

[MIT](LICENSE)

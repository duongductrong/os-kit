# Scout Report: OS Kit Tauri Project Structure

**Date**: 2026-02-28
**Agent**: scout

## Project Identity
- **Name**: OS Kit (`oskit`)
- **Identifier**: `com.duongductrong.oskit`
- **Version**: 0.1.0
- **Type**: Tauri v2 desktop app

## Tech Stack
- **Frontend**: React 19 + Vite 7 + TypeScript 5.8
- **Backend**: Rust (Tauri v2)
- **Styling**: TailwindCSS 4 + shadcn
- **Router**: TanStack React Router
- **Package Manager**: pnpm

## Key Files
- `src-tauri/tauri.conf.json` — Tauri config (product name, bundle settings, window config)
- `src-tauri/Cargo.toml` — Rust dependencies (tauri 2, shell/store/opener plugins)
- `package.json` — Frontend dependencies, scripts: dev, build, preview, tauri

## Bundle Configuration
- `bundle.active`: true
- `bundle.targets`: "all" (dmg, exe, deb, appimage, etc.)
- Icons: 32x32, 128x128, 128x128@2x, icon.icns, icon.ico

## Tauri Plugins
- `tauri-plugin-opener` v2
- `tauri-plugin-shell` v2.3.5
- `tauri-plugin-store` v2.4.2

## Build Commands
- `beforeDevCommand`: `pnpm dev`
- `beforeBuildCommand`: `pnpm build` (runs `tsc && vite build`)
- `frontendDist`: `../dist`

## GitHub Actions
- **None exist** — no `.github/workflows/` in project root

## Notes
- No code signing configured (no Apple Developer account)
- Window uses transparent background + overlay title bar (macOS native feel)
- CSP set to null (permissive)

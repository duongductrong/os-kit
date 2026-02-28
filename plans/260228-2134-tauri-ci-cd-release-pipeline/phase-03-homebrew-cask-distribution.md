# Phase 3: Homebrew Cask Distribution

## Context

- **Parent Plan**: [plan.md](./plan.md)
- **Dependencies**: [Phase 1](./phase-01-github-actions-build-release.md) (releases must publish .dmg artifacts)
- **Docs**: [Homebrew Cask Cookbook](https://docs.brew.sh/Cask-Cookbook), [Homebrew Taps](https://docs.brew.sh/Taps)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-02-28 |
| Priority | P1 |
| Effort | 45m |
| Implementation Status | Not started |
| Review Status | Pending |

Create a Homebrew tap repository (`duongductrong/homebrew-oskit`) with a cask formula for OS Kit, plus a GitHub Actions workflow that auto-updates the cask on each new release.

## Key Insights

- Homebrew tap repo must be named `homebrew-{name}` to enable `brew tap duongductrong/oskit`
- Cask formula goes in `Casks/` directory of the tap repo
- `sha256` must be computed from the actual .dmg artifact URL
- Multi-arch support uses `on_arm` / `on_intel` blocks in the cask formula
- Auto-update workflow lives in the **main oskit repo** (triggers on `release: published`)
- Needs a PAT (`HOMEBREW_TAP_TOKEN`) with `repo` scope to push to the tap repo
- Cask `caveats` block is the right place for quarantine warning

## Requirements

1. Create Homebrew tap repo `duongductrong/homebrew-oskit`
2. Write cask formula `Casks/os-kit.rb` supporting both aarch64 and x86_64
3. Auto-update cask version + sha256 on new GitHub release
4. Include quarantine caveats in cask formula
5. Enable `brew install --cask duongductrong/oskit/os-kit`

## Architecture

```
GitHub Release published (Phase 1)
  └─> .github/workflows/update-homebrew-cask.yml (in oskit repo)
       ├─> download .dmg artifacts from release
       ├─> compute sha256 for each arch
       ├─> clone duongductrong/homebrew-oskit
       ├─> update Casks/os-kit.rb (version + sha256 + url)
       └─> push to homebrew-oskit repo
```

## Related Code Files

| File | Purpose |
|------|---------|
| `.github/workflows/update-homebrew-cask.yml` | **TO CREATE** (in oskit repo) -- auto-update workflow |
| `Casks/os-kit.rb` | **TO CREATE** (in homebrew-oskit repo) -- cask formula |

## Implementation Steps

### Step 1: Create Homebrew tap repository

Create a new GitHub repo: `duongductrong/homebrew-oskit`

```bash
# Using gh CLI
gh repo create duongductrong/homebrew-oskit --public --description "Homebrew tap for OS Kit"
```

### Step 2: Create cask formula `Casks/os-kit.rb`

In the `homebrew-oskit` repo:

```ruby
cask "os-kit" do
  version "0.1.0"

  on_arm do
    url "https://github.com/duongductrong/oskit/releases/download/v#{version}/OS.Kit_#{version}_aarch64.dmg"
    sha256 "PLACEHOLDER_ARM64_SHA256"
  end

  on_intel do
    url "https://github.com/duongductrong/oskit/releases/download/v#{version}/OS.Kit_#{version}_x64.dmg"
    sha256 "PLACEHOLDER_X64_SHA256"
  end

  name "OS Kit"
  desc "Desktop toolkit application built with Tauri"
  homepage "https://github.com/duongductrong/oskit"

  app "OS Kit.app"

  caveats <<~EOS
    OS Kit is not signed with an Apple Developer certificate.
    macOS may block the app on first launch with a security warning.

    To bypass Gatekeeper, run:
      sudo xattr -rd com.apple.quarantine /Applications/OS\\ Kit.app

    Or right-click the app and select "Open" to allow it.
  EOS
end
```

**Note on artifact naming**: The exact `.dmg` filename depends on tauri-action output. Common patterns:
- `OS Kit_0.1.0_aarch64.dmg` (with spaces)
- `OS.Kit_0.1.0_aarch64.dmg` (with dots)
- `OS-Kit_0.1.0_aarch64.dmg` (with dashes)

Verify the actual filename from the first release and adjust the URL pattern accordingly.

### Step 3: Create GitHub PAT secret

1. Create a GitHub Personal Access Token with `repo` scope
2. Add it as a secret named `HOMEBREW_TAP_TOKEN` in the `oskit` repository settings
3. Settings > Secrets and variables > Actions > New repository secret

### Step 4: Create `.github/workflows/update-homebrew-cask.yml`

In the **oskit** repo:

```yaml
name: Update Homebrew Cask

on:
  release:
    types: [published]

jobs:
  update-cask:
    runs-on: ubuntu-latest

    steps:
      - name: Get release info
        id: release
        run: |
          VERSION="${GITHUB_REF_NAME#v}"
          echo "version=$VERSION" >> "$GITHUB_OUTPUT"

      - name: Download macOS DMG artifacts and compute SHA256
        id: sha
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          VERSION="${{ steps.release.outputs.version }}"
          REPO="${{ github.repository }}"

          # Download aarch64 DMG
          ARM_DMG_URL="https://github.com/${REPO}/releases/download/v${VERSION}/OS.Kit_${VERSION}_aarch64.dmg"
          curl -sL -o arm64.dmg "$ARM_DMG_URL"
          ARM_SHA=$(sha256sum arm64.dmg | cut -d' ' -f1)
          echo "arm_sha=$ARM_SHA" >> "$GITHUB_OUTPUT"

          # Download x64 DMG
          X64_DMG_URL="https://github.com/${REPO}/releases/download/v${VERSION}/OS.Kit_${VERSION}_x64.dmg"
          curl -sL -o x64.dmg "$X64_DMG_URL"
          X64_SHA=$(sha256sum x64.dmg | cut -d' ' -f1)
          echo "x64_sha=$X64_SHA" >> "$GITHUB_OUTPUT"

      - name: Update Homebrew cask
        env:
          HOMEBREW_TAP_TOKEN: ${{ secrets.HOMEBREW_TAP_TOKEN }}
        run: |
          VERSION="${{ steps.release.outputs.version }}"
          ARM_SHA="${{ steps.sha.outputs.arm_sha }}"
          X64_SHA="${{ steps.sha.outputs.x64_sha }}"

          # Clone the tap repo
          git clone "https://x-access-token:${HOMEBREW_TAP_TOKEN}@github.com/duongductrong/homebrew-oskit.git" tap
          cd tap

          # Update cask formula using sed
          sed -i "s/version \".*\"/version \"${VERSION}\"/" Casks/os-kit.rb

          # Update ARM64 sha256 (first occurrence after on_arm)
          # Update x64 sha256 (first occurrence after on_intel)
          python3 - <<'PYEOF'
          import re
          import sys

          version = "$VERSION"
          arm_sha = "$ARM_SHA"
          x64_sha = "$X64_SHA"

          with open("Casks/os-kit.rb", "r") as f:
              content = f.read()

          # Replace sha256 after on_arm block
          content = re.sub(
              r'(on_arm do\s+url "[^"]+"\s+sha256 ")[^"]+(")',
              rf'\g<1>{arm_sha}\2',
              content
          )

          # Replace sha256 after on_intel block
          content = re.sub(
              r'(on_intel do\s+url "[^"]+"\s+sha256 ")[^"]+(")',
              rf'\g<1>{x64_sha}\2',
              content
          )

          with open("Casks/os-kit.rb", "w") as f:
              f.write(content)
          PYEOF

          # Commit and push
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add Casks/os-kit.rb
          git commit -m "chore: update os-kit to v${VERSION}"
          git push
```

### Step 5: Verify the full flow

After the first release:
1. Check that `update-homebrew-cask` workflow triggers
2. Verify `Casks/os-kit.rb` is updated in the tap repo
3. Test installation:
   ```bash
   brew tap duongductrong/oskit
   brew install --cask os-kit
   ```

## Todo

- [ ] Create `duongductrong/homebrew-oskit` GitHub repo
- [ ] Add `Casks/os-kit.rb` formula to tap repo
- [ ] Create PAT and add as `HOMEBREW_TAP_TOKEN` secret
- [ ] Create `update-homebrew-cask.yml` workflow in oskit repo
- [ ] Verify DMG artifact filenames after first release match URL pattern
- [ ] Test `brew tap` + `brew install --cask` end-to-end

## Success Criteria

1. `brew tap duongductrong/oskit` succeeds
2. `brew install --cask os-kit` downloads and installs OS Kit
3. Cask auto-updates on new GitHub release
4. Quarantine caveats are displayed during installation
5. Both aarch64 and x86_64 architectures supported

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| DMG filename pattern mismatch | High | Medium | Verify from first release; adjust URL pattern in cask |
| PAT token expires or lacks scope | High | Low | Document PAT requirements; use fine-grained tokens |
| Homebrew formula audit fails | Medium | Low | Follow Homebrew Cask Cookbook conventions |
| Multi-arch DMGs not both built | High | Low | Phase 1 matrix includes both macos-latest (arm) and macos-13 (x64) |

## Security Considerations

- `HOMEBREW_TAP_TOKEN` PAT must have minimal required scope (`repo` on `homebrew-oskit` only)
- Use fine-grained PAT scoped to only the tap repository if possible
- Token is stored as GitHub Actions secret -- never committed to code
- Workflow only triggers on `release: published` -- not on arbitrary events

## Next Steps

- Proceed to [Phase 4](./phase-04-readme-documentation.md) for README installation docs
- After first release, verify exact DMG filenames and update URL patterns
- Consider adding `brew audit --cask os-kit` to CI for formula validation

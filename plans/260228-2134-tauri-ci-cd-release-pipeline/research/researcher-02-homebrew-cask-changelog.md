# Homebrew Cask & Contributor Attribution Research
Date: 2026-02-28 | App: OS Kit (`com.duongductrong.oskit`)

---

## 1. Homebrew Tap Repository Setup

Create a public GitHub repo named **`homebrew-oskit`** under `duongductrong` account.

```
duongductrong/homebrew-oskit/
└── Casks/
    └── os-kit.rb       # cask formula file
```

Naming rules:
- Repo MUST be prefixed `homebrew-` (e.g., `homebrew-oskit`)
- Cask file: lowercase, hyphenated (`os-kit.rb`)
- Users install via: `brew install duongductrong/oskit/os-kit`

---

## 2. Cask Formula for Tauri App (.dmg)

```ruby
# Casks/os-kit.rb
cask "os-kit" do
  version "0.1.0"
  sha256 "PLACEHOLDER_SHA256"

  url "https://github.com/duongductrong/oskit/releases/download/v#{version}/OS.Kit_#{version}_aarch64.dmg"
  name "OS Kit"
  desc "Developer toolkit built with Tauri"
  homepage "https://github.com/duongductrong/oskit"

  app "OS Kit.app"

  caveats <<~EOS
    OS Kit is not code-signed. macOS may block launch.
    To allow it, run:
      xattr -cr "/Applications/OS Kit.app"
    Or: System Settings → Privacy & Security → Open Anyway
  EOS
end
```

Key notes:
- `sha256` must match the actual .dmg file (update per release)
- `url` uses `#{version}` interpolation — keep consistent with release tag format
- For universal builds, use `arch` block:

```ruby
  on_arm do
    url "...aarch64.dmg"
    sha256 "ARM_SHA256"
  end
  on_intel do
    url "...x86_64.dmg"
    sha256 "INTEL_SHA256"
  end
```

---

## 3. Auto-updating Cask on Release (GitHub Actions)

Workflow in the **main oskit repo** triggered on release publish:

```yaml
# .github/workflows/update-homebrew-cask.yml
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
          VERSION="${{ github.event.release.tag_name }}"
          VERSION="${VERSION#v}"  # strip leading 'v'
          echo "version=$VERSION" >> $GITHUB_OUTPUT

      - name: Download DMG and compute sha256
        id: sha
        run: |
          VERSION="${{ steps.release.outputs.version }}"
          URL="https://github.com/duongductrong/oskit/releases/download/v${VERSION}/OS.Kit_${VERSION}_aarch64.dmg"
          curl -sL "$URL" -o app.dmg
          SHA=$(sha256sum app.dmg | awk '{print $1}')
          echo "sha256=$SHA" >> $GITHUB_OUTPUT
          echo "url=$URL" >> $GITHUB_OUTPUT

      - name: Checkout homebrew tap
        uses: actions/checkout@v4
        with:
          repository: duongductrong/homebrew-oskit
          token: ${{ secrets.HOMEBREW_TAP_TOKEN }}
          path: tap

      - name: Update cask formula
        run: |
          VERSION="${{ steps.release.outputs.version }}"
          SHA="${{ steps.sha.outputs.sha256 }}"
          sed -i "s/version \".*\"/version \"$VERSION\"/" tap/Casks/os-kit.rb
          sed -i "s/sha256 \".*\"/sha256 \"$SHA\"/" tap/Casks/os-kit.rb

      - name: Commit and push
        run: |
          cd tap
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add Casks/os-kit.rb
          git commit -m "chore: update os-kit to v${{ steps.release.outputs.version }}"
          git push
```

**Required secret:** `HOMEBREW_TAP_TOKEN` — a GitHub PAT with `repo` scope, set in the **oskit** repo secrets, with write access to `homebrew-oskit`.

---

## 4. Contributor Attribution

### Extract contributors between releases

```bash
# Between two tags
git shortlog v0.1.0..v0.2.0 --summary --numbered --email

# GitHub API — contributors since a date
gh api repos/duongductrong/oskit/commits \
  --paginate \
  -f since="2026-01-01T00:00:00Z" \
  --jq '.[].author.login' | sort -u
```

### GitHub auto-generated release notes (recommended)

In `.github/release.yml`:

```yaml
changelog:
  exclude:
    labels:
      - ignore-for-release
  categories:
    - title: New Features
      labels: ["feat", "enhancement"]
    - title: Bug Fixes
      labels: ["fix", "bug"]
    - title: Other Changes
      labels: ["*"]
```

GitHub auto-appends a "New Contributors" section when using "Generate release notes" in the UI or via API:
```bash
gh api repos/duongductrong/oskit/releases/generate-notes \
  -f tag_name="v0.2.0" \
  -f previous_tag_name="v0.1.0"
```

### CHANGELOG.md format

```markdown
## [0.2.0] - 2026-02-28
### Added
- Feature X (#12) @contributor1
### Fixed
- Bug Y (#15) @contributor2

### Contributors
Thanks to @contributor1, @contributor2 for this release!
```

---

## 5. README Installation Section

```markdown
## Installation

### Homebrew (macOS, recommended)
\`\`\`sh
brew tap duongductrong/oskit
brew install os-kit
\`\`\`

### Direct Download
Download the latest `.dmg` from [GitHub Releases](https://github.com/duongductrong/oskit/releases).

### Unsigned App Workaround
macOS may block launch since the app is not notarized. Run:
\`\`\`sh
xattr -cr "/Applications/OS Kit.app"
\`\`\`
Or go to **System Settings → Privacy & Security** and click **Open Anyway**.
```

---

## Unresolved Questions

1. Does the release produce both `aarch64` and `x86_64` DMGs? If so, cask needs `on_arm`/`on_intel` blocks and two sha256 values in the update workflow.
2. Is the repo public? Homebrew taps require public repos for open distribution.
3. Tag format: is it `v0.1.0` or `0.1.0`? The `sed` strip logic in the workflow must match.
4. App bundle name inside DMG: confirm it is exactly `OS Kit.app` (the `app` field in cask must match).

# Phase 1: Modify Semantic-Release Commit Filter

## Context

- **Parent Plan**: [plan.md](./plan.md)
- **Dependencies**: Existing `.releaserc.json` from CI/CD pipeline plan
- **Docs**: [semantic-release commit-analyzer](https://github.com/semantic-release/commit-analyzer#releaserules)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-02-28 |
| Priority | P2 |
| Effort | 15m |
| Implementation Status | Not started |
| Review Status | Pending |

Replace the default `@semantic-release/commit-analyzer` config with custom `releaseRules` that only trigger releases on `release:` commit type.

## Key Insights

- `@semantic-release/commit-analyzer` supports custom `releaseRules` array
- Each rule maps a `type` to a `release` level (`major`, `minor`, `patch`, or `false`)
- Setting `release: false` explicitly blocks that type from triggering a release
- The `breaking` flag on `release` type handles `release!:` → major bump
- Default types (`feat`, `fix`, etc.) must be explicitly set to `false` to override defaults

## Requirements

1. `release: <msg>` → triggers minor release (default for new bundled features)
2. `release(scope): <msg>` → triggers patch release
3. `release!: <msg>` or `BREAKING CHANGE` footer → triggers major release
4. `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `perf:`, `test:`, `ci:`, `style:` → NO release
5. No changes to workflow YAML files

## Related Code Files

| File | Action |
|------|--------|
| `.releaserc.json` | **MODIFY** — add `releaseRules` to commit-analyzer |

## Implementation Steps

### Step 1: Update `.releaserc.json`

Replace the bare `"@semantic-release/commit-analyzer"` string with a configured array entry:

**Current** (line 4):
```json
"@semantic-release/commit-analyzer",
```

**New**:
```json
["@semantic-release/commit-analyzer", {
  "preset": "conventionalcommits",
  "releaseRules": [
    { "type": "release", "release": "minor" },
    { "type": "release", "scope": "*", "release": "patch" },
    { "breaking": true, "release": "major" },
    { "type": "feat", "release": false },
    { "type": "fix", "release": false },
    { "type": "perf", "release": false },
    { "type": "refactor", "release": false },
    { "type": "docs", "release": false },
    { "type": "style", "release": false },
    { "type": "test", "release": false },
    { "type": "ci", "release": false },
    { "type": "chore", "release": false },
    { "type": "build", "release": false },
    { "type": "revert", "release": false }
  ]
}],
```

**Logic**:
- `release:` with no scope → **minor** (bundled features/fixes into a release)
- `release(scope):` with a scope → **patch** (targeted scope release)
- Any commit with `breaking: true` (i.e., `release!:` or `BREAKING CHANGE` footer) → **major**
- All standard types explicitly return `false` → no release

### Step 2: Also update `release-notes-generator` to recognize `release` type

Replace bare `"@semantic-release/release-notes-generator"` with:

```json
["@semantic-release/release-notes-generator", {
  "preset": "conventionalcommits",
  "presetConfig": {
    "types": [
      { "type": "release", "section": "Release", "hidden": false },
      { "type": "feat", "section": "Features", "hidden": false },
      { "type": "fix", "section": "Bug Fixes", "hidden": false },
      { "type": "perf", "section": "Performance", "hidden": false },
      { "type": "refactor", "section": "Refactors", "hidden": true },
      { "type": "docs", "section": "Documentation", "hidden": true },
      { "type": "chore", "section": "Maintenance", "hidden": true },
      { "type": "ci", "section": "CI", "hidden": true },
      { "type": "test", "section": "Tests", "hidden": true },
      { "type": "style", "section": "Styles", "hidden": true },
      { "type": "build", "section": "Build", "hidden": true }
    ]
  }
}],
```

This ensures `release:` commits appear in the changelog under a "Release" section.

### Step 3: Install `conventional-changelog-conventionalcommits` preset

```bash
pnpm add -D conventional-changelog-conventionalcommits
```

Required when using `"preset": "conventionalcommits"` in commit-analyzer and release-notes-generator.

### Step 4: Update README contributing section

Add `release:` type to the conventional commits guide:

```markdown
- `release: bundle v1.1 features` — triggers a new release build
- `feat: add new feature` — normal commit (no release)
- `fix: resolve bug` — normal commit (no release)
```

## Todo

- [ ] Update `.releaserc.json` with custom `releaseRules`
- [ ] Update `release-notes-generator` with `conventionalcommits` preset config
- [ ] Install `conventional-changelog-conventionalcommits`
- [ ] Update README contributing section with `release:` type docs

## Success Criteria

1. `release: bundle features` commit → triggers full release pipeline
2. `feat: add X` commit → semantic-release outputs `new_release_published: false`
3. `fix: bug Y` commit → no release triggered
4. `release!: breaking change` → major version bump
5. Changelog includes `release:` commits under "Release" section

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Developer forgets `release:` type | Low | Medium | Add docs to README contributing section |
| `conventional-changelog-conventionalcommits` version conflict | Low | Low | Use caret version range |

## Security Considerations

- No new secrets or permissions required
- Config-only change, no runtime code affected

## Next Steps

- After implementation, test with a `feat:` push (should NOT release) followed by a `release:` push (should release)
- Consider adding a commitlint rule to validate `release:` format

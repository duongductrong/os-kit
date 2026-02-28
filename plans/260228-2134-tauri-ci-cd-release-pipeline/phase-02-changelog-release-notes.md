# Phase 2: Changelog & Release Notes

## Context

- **Parent Plan**: [plan.md](./plan.md)
- **Dependencies**: [Phase 1](./phase-01-github-actions-build-release.md) (release workflow must exist)
- **Docs**: [GitHub auto-generated release notes](https://docs.github.com/en/repositories/releasing/automatically-generated-release-notes)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-02-28 |
| Priority | P1 |
| Effort | 30m |
| Implementation Status | Not started |
| Review Status | Pending |

Configure GitHub auto-generated release notes with categorized changelogs based on conventional commit prefixes. Add contributor attribution and unsigned app notice to every release.

## Key Insights

- GitHub's `.github/release.yml` auto-categorizes PRs/commits by label into release note sections
- "New Contributors" section is auto-included by GitHub -- no extra config needed
- Conventional commit prefixes (`feat:`, `fix:`, `chore:`) map to PR labels via branch naming or manual labels
- The `releaseBody` in tauri-action serves as the header; GitHub appends auto-generated notes below it
- For projects without PRs (direct pushes to master), GitHub uses commit messages instead

## Requirements

1. Categorize release notes into: Features, Bug Fixes, Maintenance, Other
2. Auto-include contributor attribution
3. Include unsigned macOS app notice in every release
4. Use conventional commit format for categorization

## Architecture

```
release created by tauri-action
  --> GitHub reads .github/release.yml
  --> auto-generates categorized notes from commits/PRs between tags
  --> appends to releaseBody from Phase 1
  --> "New Contributors" auto-appended by GitHub
```

## Related Code Files

| File | Purpose |
|------|---------|
| `.github/release.yml` | **TO CREATE** -- release notes categories config |
| `.github/workflows/release.yml` | Existing release workflow (Phase 1) -- may need `releaseBody` update |

## Implementation Steps

### Step 1: Create `.github/release.yml`

This file configures auto-generated release notes categories.

```yaml
changelog:
  exclude:
    labels:
      - ignore-for-release
    authors:
      - dependabot
      - github-actions

  categories:
    - title: "🚀 New Features"
      labels:
        - enhancement
        - feature
      exclude:
        labels:
          - bug

    - title: "🐛 Bug Fixes"
      labels:
        - bug
        - fix

    - title: "🔧 Maintenance"
      labels:
        - chore
        - dependencies
        - ci
        - docs

    - title: "📦 Other Changes"
      labels:
        - "*"
```

### Step 2: Update release workflow body

Update the `releaseBody` in `.github/workflows/release.yml` to complement auto-generated notes:

```yaml
releaseBody: |
  ## Installation

  Download the appropriate installer for your platform from the assets below.

  ### macOS
  > **Note**: OS Kit is not signed with an Apple Developer certificate.
  > After installing, open Terminal and run:
  > ```
  > sudo xattr -rd com.apple.quarantine /Applications/OS\ Kit.app
  > ```

  ---

  ## What's Changed
```

The "What's Changed" heading connects to GitHub's auto-generated content which appears below the release body.

### Step 3: Add PR labeling for conventional commits (optional enhancement)

For better categorization, create `.github/labeler.yml` with [actions/labeler](https://github.com/actions/labeler) -- but this is optional for MVP. Commits pushed directly to master rely on GitHub's commit-based notes.

### Step 4: Verify release notes

After first release:
- Check that commits appear categorized under correct headings
- Verify "New Contributors" section appears
- Confirm quarantine instructions are visible

## Todo

- [ ] Create `.github/release.yml` with changelog categories
- [ ] Update `releaseBody` in release workflow to include install instructions
- [ ] Verify auto-generated notes after first release
- [ ] (Optional) Add PR labeler for conventional commit auto-labeling

## Success Criteria

1. Release notes show categorized sections (Features, Bug Fixes, Maintenance)
2. Contributors are attributed in release notes
3. Unsigned macOS notice is visible in every release
4. Categories map correctly to commit types

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Direct pushes bypass PR labels | Medium | High | GitHub falls back to commit-based notes; categories still work with labels |
| Conventional commits not enforced | Low | Medium | Add commitlint later if needed; not required for MVP |

## Security Considerations

- `.github/release.yml` is a config file only -- no secrets or permissions involved
- Release notes are public; ensure no sensitive info leaks in commit messages

## Next Steps

- Proceed to [Phase 3](./phase-03-homebrew-cask-distribution.md) for Homebrew Cask setup
- Consider adding `commitlint` + `husky` for enforcing conventional commits (future enhancement)

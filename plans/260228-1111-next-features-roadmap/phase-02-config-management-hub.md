# Phase 2: Config Management Hub

## Context

- **Parent plan:** [plan.md](plan.md)
- **Dependencies:** Phase 1 (settings persistence)
- **Docs:** [brainstorm report](../reports/brainstorm-260228-1111-next-features-roadmap.md)

## Overview

- **Date:** 2026-02-28
- **Description:** Build visual editors for ~/.gitconfig, ~/.ssh/config, and /etc/hosts — extending the zshrc editor pattern into a reusable config editor framework
- **Priority:** P1
- **Implementation status:** Pending
- **Review status:** Pending
- **Effort:** 12h

## Key Insights

1. Zshrc editor (`src/features/shell/`) is the template: hook (I/O + state) → parser → top-level component → visual sub-components
2. Each config file format differs: INI-like (gitconfig), SSH config, hosts file — need format-specific parsers
3. Shared abstraction: all config editors need read, write, backup, restore — extract `useConfigFile` hook
4. Hosts file requires sudo elevation via `osascript` on macOS
5. SSH key generation is an action (not just editing) — needs a generation dialog

## Requirements

### 2.1 Reusable Config Editor Framework
- Extract from `src/features/shell/hooks/use-zshrc-editor.ts`:
  - `src/hooks/use-config-file.ts` — generic file read/write/backup/restore via Tauri shell
  - Shared backup naming: `{filename}.backup.{timestamp}`
  - Error handling for file not found, permission denied, parse errors
- Each feature still owns its own parser and visual components

### 2.2 Git Config Editor
- Route: `/git-config` (new file-based route)
- Parse `~/.gitconfig` (INI format with `[section]` and `key = value`)
- Sections to edit:
  - **User:** `user.name`, `user.email`
  - **Core:** `core.editor`, `core.autocrlf`, `core.pager`
  - **Aliases:** `[alias]` section — list of alias name → command
  - **GPG:** `commit.gpgsign`, `user.signingkey`, `gpg.program`
  - **Pull/Push:** `pull.rebase`, `push.autoSetupRemote`, `push.default`
- Read command: `cat ~/.gitconfig`
- Write command: write full file content back via shell
- Add "Git Config" to sidebar under "Mac" group

### 2.3 SSH Key Manager
- Route: `/ssh` (new file-based route)
- Two sub-features:
  - **SSH Keys list:** scan `~/.ssh/` for `*.pub` files, show key type, fingerprint, comment
  - **SSH Config editor:** parse `~/.ssh/config` (Host blocks with indented key-value pairs)
- Actions:
  - Generate new key: `ssh-keygen -t {type} -C {comment} -f {path}` — dialog with type (ed25519, rsa), filename, comment, passphrase
  - Copy public key: read `.pub` file, copy to clipboard via Tauri
  - Delete key pair: remove both private + .pub files (with confirmation)
- SSH Config sections:
  - Each `Host` block as a card/row: Host, HostName, User, Port, IdentityFile, ProxyJump
  - Add/remove/edit Host blocks
- Add "SSH" to sidebar under "Mac" group

### 2.4 Hosts File Editor
- Route: `/hosts` (new file-based route)
- Parse `/etc/hosts`: each line is `IP  hostname  # comment` or commented out
- Features:
  - List all entries in a table (IP, hostname, comment, enabled/disabled toggle)
  - Add new entry: IP input + hostname input
  - Remove entry (with confirmation)
  - Toggle entry: comment/uncomment the line
  - Group by: system entries (localhost, broadcasthost) vs user entries
- Read: `cat /etc/hosts` (no sudo needed for read)
- Write: `osascript -e 'do shell script "tee /etc/hosts" with administrator privileges'` with piped content
- Show warning: "Editing hosts file requires admin password"
- Add "Hosts" to sidebar under "Mac" group

## Architecture

### Shared Module
```
src/hooks/
└── use-config-file.ts        # Generic config file I/O hook
    - readFile(path: string): Promise<string>
    - writeFile(path: string, content: string, sudo?: boolean): Promise<void>
    - createBackup(path: string): Promise<string>
    - restoreBackup(path: string, backupPath: string): Promise<void>
    - listBackups(path: string): Promise<string[]>
```

### Git Config Feature
```
src/features/git-config/
├── components/
│   ├── git-config-editor.tsx           # Top-level component
│   └── visual-editor/
│       ├── user-section.tsx            # user.name, user.email
│       ├── core-section.tsx            # core.editor, etc.
│       ├── aliases-section.tsx         # alias list
│       ├── gpg-section.tsx             # GPG signing config
│       └── pull-push-section.tsx       # pull/push settings
├── hooks/
│   └── use-git-config.ts              # State management hook
└── utils/
    └── parse-git-config.ts            # INI parser for gitconfig
```

### SSH Feature
```
src/features/ssh/
├── components/
│   ├── ssh-manager.tsx                # Top-level component with tabs
│   ├── ssh-keys-list.tsx              # Key listing and actions
│   ├── ssh-key-generate-dialog.tsx    # Key generation form
│   └── ssh-config-editor.tsx          # SSH config host blocks editor
├── hooks/
│   ├── use-ssh-keys.ts               # Key listing, generation, deletion
│   └── use-ssh-config.ts             # SSH config file state
└── utils/
    ├── parse-ssh-config.ts            # SSH config parser
    └── parse-ssh-key.ts               # Parse .pub file metadata
```

### Hosts Feature
```
src/features/hosts/
├── components/
│   ├── hosts-editor.tsx               # Top-level component
│   ├── hosts-entry-row.tsx            # Single entry row with toggle
│   └── hosts-add-dialog.tsx           # Add new entry dialog
├── hooks/
│   └── use-hosts-file.ts             # Hosts file state + sudo write
└── utils/
    └── parse-hosts.ts                 # /etc/hosts parser
```

### New Routes
```
src/routes/
├── git-config.tsx                     # /git-config route
├── ssh.tsx                            # /ssh route
└── hosts.tsx                          # /hosts route
```

### Modified Files
```
src/components/app-sidebar.tsx         # Add Git Config, SSH, Hosts nav items
src/features/shell/hooks/use-zshrc-editor.ts  # Refactor to use shared use-config-file
```

## Related Code Files

| File | Relevance |
|---|---|
| `src/features/shell/hooks/use-zshrc-editor.ts` | Template for config editor hooks |
| `src/features/shell/utils/parse-zshrc.ts` | Template for config parsers |
| `src/features/shell/components/zshrc-editor.tsx` | Template for editor component |
| `src/hooks/use-tool-detection.ts` | Shell command execution pattern |
| `src/components/ui/section.tsx` | Layout primitive for all editors |

## Implementation Steps

### Step 1: Extract shared config file hook (1.5h)
1. Create `src/hooks/use-config-file.ts`
2. Extract `readFile`, `writeFile`, `createBackup`, `restoreBackup` from `use-zshrc-editor.ts`
3. Add `sudo` option for `writeFile` (uses `osascript` on macOS)
4. Refactor `use-zshrc-editor.ts` to consume `use-config-file`
5. Verify zshrc editor still works after refactor

### Step 2: Git Config Editor (3h)
1. Create `parse-git-config.ts` — parse INI format into `{ section: { key: value } }` structure
2. Create `use-git-config.ts` — uses `use-config-file("~/.gitconfig")`
3. Create visual editor components (user, core, aliases, gpg, pull-push sections)
4. Create `git-config-editor.tsx` assembling all sections
5. Create `src/routes/git-config.tsx` route
6. Add to sidebar navigation
7. Test read → edit → save → verify round-trip

### Step 3: SSH Key Manager (4h)
1. Create `parse-ssh-key.ts` — parse `.pub` file (type, key, comment), extract fingerprint via `ssh-keygen -lf`
2. Create `parse-ssh-config.ts` — parse Host blocks into structured data
3. Create `use-ssh-keys.ts` — list keys, generate key, delete key, copy to clipboard
4. Create `use-ssh-config.ts` — uses `use-config-file("~/.ssh/config")`
5. Create `ssh-key-generate-dialog.tsx` with form fields: type (ed25519/rsa), filename, comment, passphrase
6. Create `ssh-keys-list.tsx` — table of keys with actions
7. Create `ssh-config-editor.tsx` — card-per-host editing
8. Create `ssh-manager.tsx` — tabs between Keys and Config
9. Create `src/routes/ssh.tsx` route
10. Add to sidebar

### Step 4: Hosts File Editor (3.5h)
1. Create `parse-hosts.ts` — parse lines into `{ ip, hostname, comment, enabled }[]`
2. Create `use-hosts-file.ts` — uses `use-config-file("/etc/hosts", { sudo: true })`
3. Create `hosts-entry-row.tsx` with toggle switch (comment/uncomment)
4. Create `hosts-add-dialog.tsx` with IP + hostname inputs
5. Create `hosts-editor.tsx` — grouped list (system vs user entries)
6. Show admin password warning banner
7. Create `src/routes/hosts.tsx` route
8. Add to sidebar
9. Test: add entry → password prompt → verify file updated

## Todo List

- [ ] Create use-config-file.ts shared hook
- [ ] Refactor use-zshrc-editor.ts to use shared hook
- [ ] Create parse-git-config.ts (INI parser)
- [ ] Create use-git-config.ts hook
- [ ] Create git config visual editor components
- [ ] Create /git-config route
- [ ] Create parse-ssh-key.ts and parse-ssh-config.ts
- [ ] Create use-ssh-keys.ts and use-ssh-config.ts hooks
- [ ] Create SSH key generation dialog
- [ ] Create SSH keys list component
- [ ] Create SSH config editor component
- [ ] Create /ssh route
- [ ] Create parse-hosts.ts
- [ ] Create use-hosts-file.ts with sudo writing
- [ ] Create hosts editor components
- [ ] Create /hosts route
- [ ] Add all 3 routes to sidebar navigation
- [ ] Test round-trip for each editor (read → edit → save → verify)

## Success Criteria

- Git config: edit user.name, save, verify `git config user.name` returns new value
- Git config: add/edit/remove aliases, verify in `~/.gitconfig`
- SSH: generate ed25519 key, verify files created in `~/.ssh/`
- SSH: copy public key to clipboard, paste matches file content
- SSH: edit Host block, verify `~/.ssh/config` updated
- Hosts: add entry, admin password prompt appears, entry visible in `/etc/hosts`
- Hosts: toggle entry off, line is commented out; toggle on, uncommented
- All editors: backup created before save, restore works
- Zshrc editor: still works after refactor (regression test)

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|---|---|---|---|
| INI parser edge cases (multiline values, includes) | Med | Med | Use simple parser, handle common cases; warn on unsupported syntax |
| SSH key passphrase handling | Med | Low | Use Tauri shell stdin piping or skip passphrase (optional field) |
| sudo prompt UX (osascript) | Med | Med | Clear warning banner, explain why admin needed |
| Corrupting config files | High | Low | Mandatory backup before every write, restore button |
| `~/.ssh/config` permissions (must be 600) | Med | Med | Set permissions after write: `chmod 600 ~/.ssh/config` |

## Security Considerations

- Never log or display private SSH key contents — only public keys shown
- SSH key passphrases: never stored, only passed to `ssh-keygen` during generation
- File backups include timestamps to prevent overwriting previous backups
- Hosts file sudo: uses native macOS dialog (osascript), no password stored
- File permissions preserved after write (especially `~/.ssh/` files)
- Validate parsed data before writing back to prevent file corruption

## Next Steps

After Phase 2, proceed to [Phase 3: Workflow Tools](phase-03-workflow-tools.md).

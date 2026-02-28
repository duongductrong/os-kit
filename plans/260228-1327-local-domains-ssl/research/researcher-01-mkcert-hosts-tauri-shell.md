# Research: mkcert, /etc/hosts, Tauri Shell — Local Domains SSL

Date: 2026-02-28

---

## 1. mkcert CLI Usage

### Check if installed
```sh
which mkcert 2>/dev/null && mkcert --version || echo "not-installed"
```

### Check / get CA root path
```sh
mkcert -CAROOT
# Returns: /Users/<user>/Library/Application Support/mkcert
```
Empty output or missing dir = CA not installed.

### Install local CA
```sh
mkcert -install
```
No sudo needed on macOS — uses Security framework + native Keychain dialog.

### Generate cert for a domain
```sh
mkcert domain.local
# Multiple SANs / wildcard:
mkcert domain.local "*.domain.local" localhost 127.0.0.1
```

### Output file naming conventions
| Input | Key file | Cert file |
|---|---|---|
| `mkcert domain.local` | `domain.local-key.pem` | `domain.local.pem` |
| `mkcert foo.local bar.local` | `foo.local+1-key.pem` | `foo.local+1.pem` |
| `mkcert "*.foo.local"` | `_wildcard.foo.local-key.pem` | `_wildcard.foo.local.pem` |

Files written to cwd by default. Override with `-cert-file` / `-key-file` flags.

### Cert storage best practice
Store under app-controlled dir:
```
~/Library/Application Support/oskit/certs/<domain>/cert.pem
~/Library/Application Support/oskit/certs/<domain>/key.pem
```
Generate with explicit paths:
```sh
mkcert -cert-file "$CERT_DIR/cert.pem" -key-file "$CERT_DIR/key.pem" domain.local
```

### Check cert expiry
```sh
openssl x509 -enddate -noout -in cert.pem
# notAfter=Jan  1 00:00:00 2028 GMT
```
mkcert default validity: ~2 years. Parse `notAfter` to surface expiry warnings in UI.

---

## 2. /etc/hosts Management on macOS

### Read (no sudo)
```sh
cat /etc/hosts
```
World-readable. No elevation needed.

### Write (requires root)
`/etc/hosts` is `root:wheel` — write requires elevation.

**Existing oskit pattern** (`use-config-file.ts`, `sudo: true`):
```ts
await runSh(
  `echo '${base64}' | base64 -d | osascript -e 'do shell script "cat > /etc/hosts" with administrator privileges'`
);
```
Triggers native macOS auth dialog. No stored credentials. Reuse as-is.

### Flush DNS cache after hosts changes
```sh
# Both commands need sudo — wrap in single osascript call:
osascript -e 'do shell script "dscacheutil -flushcache && killall -HUP mDNSResponder" with administrator privileges'
```
Call immediately after every successful hosts save.

### Managed entry markers
Append `# oskit-managed` inline comment on every added line:
```
127.0.0.1   myapp.local   # oskit-managed
```
Extend existing `HostsEntry` with `isManagedByOskit: boolean` derived from `comment.includes("oskit-managed")`. On removal, only delete lines carrying this marker.

### Conflict detection
```ts
const conflict = entries.find(e => e.hostname === newHostname && e.ip !== newIp);
const duplicate = entries.find(e => e.hostname === newHostname && e.ip === newIp);
// conflict → warn; duplicate → skip (idempotent)
```

---

## 3. Tauri Shell Command Patterns

### Current project setup (already wired)
- `tauri_plugin_shell` registered in `lib.rs`
- `shell:allow-execute` + `shell:allow-spawn` for `sh -c <any>` in `default.json`
- `runSh(cmd)` helper in `use-config-file.ts` — single reusable abstraction

### Running commands (Tauri v2)
```ts
import { Command } from "@tauri-apps/plugin-shell";

const output = await Command.create("exec-sh", ["-c", "mkcert -CAROOT"]).execute();
// .stdout, .stderr, .code
```

### Sudo / elevated privileges
No native sudo in Tauri shell plugin. Project-established pattern: osascript `with administrator privileges` — shows macOS native auth dialog, no credentials stored.

mkcert cert generation: no sudo needed, plain `runSh()`.
DNS flush + hosts write: osascript elevation.

### Handling stdout/stderr
```ts
async function runSh(cmd: string): Promise<string> {
  const output = await Command.create("exec-sh", ["-c", cmd]).execute();
  if (output.code !== 0) throw new Error(output.stderr || `exit ${output.code}`);
  return output.stdout.trim();
}
```
`output.code === null` = process killed/timeout → treat as error.

### Security considerations
- Capability `{ "validator": ".+" }` allows any sh — acceptable for a trusted developer tool.
- Sanitize domain names before shell interpolation: reject spaces and shell metacharacters.
- Restrict cert output to `~/Library/Application Support/oskit/certs/` — never user-supplied paths.
- Log file paths and exit codes only; never log cert/key content.

---

## Implementation Notes

- Reuse `useConfigFile({ path: "/etc/hosts", sudo: true })` — zero new sudo plumbing.
- New `use-local-domains.ts` hook composes hosts management + mkcert shell calls.
- DNS flush fires after every successful hosts save.
- Cert dir per domain: `~/Library/Application Support/oskit/certs/<sanitized-domain>/`.
- On mount: `which mkcert` — show install prompt if missing.
- `# oskit-managed` marker enables safe, targeted removal without touching user entries.

---

## Unresolved Questions

1. Should certs survive app reinstall? If yes, export/import flow or store outside app sandbox needed.
2. `mkcert -install` may need separate Firefox NSS trust step — automate or document only?
3. DNS flush uses osascript (separate auth prompt from hosts write) — one combined osascript call preferable to reduce auth fatigue.
4. Wildcard cert support (`*.domain.local`) in v1 or defer?

# Phase 1: Core Domain Management Hook & Utils

## Context Links

- [Plan](./plan.md)
- [Research: mkcert, hosts, Tauri shell](./research/researcher-01-mkcert-hosts-tauri-shell.md)

## Overview

Build the foundational data layer: domain type definitions, validation utils, and a hook that composes `useHostsFile` with domain-specific logic (add/remove domains in /etc/hosts with `# oskit-managed` markers, DNS cache flush).

## Key Insights

- Existing `useHostsFile` already handles /etc/hosts read/write with sudo elevation
- `# oskit-managed` inline comment enables safe targeted removal without touching user entries
- DNS flush (`dscacheutil -flushcache && killall -HUP mDNSResponder`) needs sudo via osascript
- Domain names must be sanitized before shell interpolation (reject spaces, metacharacters)

## Requirements

1. `LocalDomain` type with fields: domain, port, hostsEnabled, certExists, certExpiry, proxyConfigured
2. Domain validation: lowercase, alphanumeric + hyphens + dots, must end in `.local` or similar TLD, no shell metacharacters
3. Add domain = add `127.0.0.1 <domain> # oskit-managed` to /etc/hosts via `useHostsFile.addEntry`
4. Remove domain = remove only lines with `# oskit-managed` marker matching domain
5. Flush DNS cache after every successful hosts save
6. Conflict detection: warn if domain already exists with different IP

## Architecture

```
validate-domain.ts    Pure functions, no side effects
cert-paths.ts         Pure path helpers using appDataDir
use-local-domains.ts  Composes useHostsFile + shell commands
```

### Type Definitions (in `use-local-domains.ts`)

```ts
interface LocalDomain {
  domain: string;        // e.g. "myapp.local"
  port: number;          // e.g. 3000
  hostsEnabled: boolean; // entry exists and enabled in /etc/hosts
  certExists: boolean;   // cert.pem exists in cert dir
  certExpiry: string | null; // ISO date or null
  proxyType: "caddy" | "nginx" | null;
}
```

## Related Code Files

- `src/hooks/use-config-file.ts` -- `runSh()`, `useConfigFile()`
- `src/features/hosts/hooks/use-hosts-file.ts` -- `useHostsFile()`
- `src/features/hosts/utils/parse-hosts.ts` -- `parseHosts()`, `buildHosts()`, `HostsEntry`

## Implementation Steps

### 1. Create `src/features/local-domains/utils/validate-domain.ts` (~40 lines)

```ts
const DOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;
const SHELL_UNSAFE = /[;&|`$(){}[\]!#~'"\\<>\s]/;

export function isValidDomain(domain: string): boolean
export function sanitizeDomain(domain: string): string  // lowercase, trim
export function getDomainError(domain: string): string | null
```

- Max length 253, each label max 63
- Reject reserved: `localhost`, `broadcasthost`
- Shell safety: reject if SHELL_UNSAFE matches

### 2. Create `src/features/local-domains/utils/cert-paths.ts` (~30 lines)

```ts
import { appDataDir } from "@tauri-apps/api/path";

export async function getCertDir(domain: string): Promise<string>
// Returns: ~/Library/Application Support/oskit/certs/<domain>/

export function getCertPath(certDir: string): string  // certDir + "/cert.pem"
export function getKeyPath(certDir: string): string   // certDir + "/key.pem"
```

### 3. Create `src/features/local-domains/hooks/use-local-domains.ts` (~130 lines)

```ts
export function useLocalDomains() {
  // Compose useHostsFile for hosts management
  // On mount: scan oskit-managed entries from hosts, scan cert dirs
  // Expose: domains, addDomain, removeDomain, refreshDomains
}
```

Key operations:
- `addDomain(domain, port)`: validate -> addEntry to hosts with `# oskit-managed` comment -> flush DNS
- `removeDomain(domain)`: find oskit-managed entries matching domain -> removeEntry -> flush DNS -> optionally delete cert files
- `getManagedDomains()`: filter hosts entries where `comment.includes("oskit-managed")`
- `flushDns()`: `runSh("osascript -e 'do shell script \"dscacheutil -flushcache && killall -HUP mDNSResponder\" with administrator privileges'")`

### 4. DNS flush integration

Combine DNS flush with hosts save to reduce auth prompts. After `configFile.save()`, immediately call `flushDns()`. Consider combining into single osascript call in future optimization.

## Todo List

- [ ] Create `validate-domain.ts` with domain regex, sanitization, error messages
- [ ] Create `cert-paths.ts` with app data dir path helpers
- [ ] Create `use-local-domains.ts` composing useHostsFile + domain logic
- [ ] Add DNS flush after hosts save
- [ ] Add conflict detection for duplicate domains
- [ ] Verify `# oskit-managed` marker round-trips through parseHosts/buildHosts

## Success Criteria

- `addDomain("myapp.local", 3000)` adds `127.0.0.1	myapp.local	# oskit-managed` to /etc/hosts
- `removeDomain("myapp.local")` removes only oskit-managed lines matching that domain
- DNS cache flushed after every hosts mutation
- Invalid domains rejected with meaningful error messages
- No shell injection possible via domain input

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| DNS flush requires separate sudo prompt | UX friction | Combine with hosts write in single osascript call |
| parseHosts loses `# oskit-managed` comment | Data loss | Verify buildHosts preserves comments; add test |
| Domain collision with existing non-oskit entry | User confusion | Warn user, don't overwrite |

## Security Considerations

- All domain strings validated against SHELL_UNSAFE regex before shell interpolation
- Only `127.0.0.1` IP allowed for oskit-managed entries (hardcoded, not user-supplied)
- Cert paths restricted to app data dir; never accept user-supplied paths
- Never log cert/key file contents

## Next Steps

Phase 2 builds on this by adding `use-mkcert.ts` hook that uses `cert-paths.ts` to generate and manage SSL certificates per domain.

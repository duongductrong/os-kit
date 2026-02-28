# Phase 2: SSL Certificate Management

## Context Links

- [Plan](./plan.md)
- [Phase 1: Core Domain Management](./phase-01-core-domain-management.md)
- [Research: mkcert](./research/researcher-01-mkcert-hosts-tauri-shell.md)

## Overview

Add mkcert integration: detect installation, install local CA, generate per-domain SSL certs, check expiry, delete certs. All via `runSh()` shell commands.

## Key Insights

- `mkcert -install` uses macOS Security framework (no sudo), shows native Keychain dialog
- Cert generation: `mkcert -cert-file X -key-file Y domain.local` -- no sudo needed
- Default validity ~2 years; check with `openssl x509 -enddate -noout -in cert.pem`
- Store at `~/Library/Application Support/oskit/certs/<domain>/cert.pem` and `key.pem`
- `mkcert -CAROOT` returns CA root path; empty = CA not installed

## Requirements

1. Detect mkcert binary (`which mkcert`)
2. Check if CA is installed (`mkcert -CAROOT` + verify dir exists)
3. Install CA (`mkcert -install`) -- show progress indicator
4. Generate cert for domain with explicit output paths
5. List existing certs by scanning cert directory
6. Check cert expiry date
7. Delete cert files for a domain
8. Surface expiry warnings (< 30 days)

## Architecture

```
use-mkcert.ts     Hook for all mkcert operations
cert-paths.ts     (from Phase 1) path helpers
```

### Hook Interface

```ts
interface MkcertState {
  isInstalled: boolean;       // mkcert binary found
  isCAInstalled: boolean;     // local CA trusted
  caRootPath: string | null;
  isChecking: boolean;
  error: string | null;
}

export function useMkcert() {
  // Returns: state + operations
  checkInstallation(): Promise<void>
  installCA(): Promise<void>
  generateCert(domain: string): Promise<{ certPath: string; keyPath: string }>
  checkExpiry(certPath: string): Promise<string | null>  // ISO date
  deleteCert(domain: string): Promise<void>
  getCertStatus(domain: string): Promise<{ exists: boolean; expiry: string | null }>
}
```

## Related Code Files

- `src/hooks/use-config-file.ts` -- `runSh()` helper
- `src/features/local-domains/utils/cert-paths.ts` -- from Phase 1

## Implementation Steps

### 1. Create `src/features/local-domains/hooks/use-mkcert.ts` (~140 lines)

**Detection logic (on mount):**
```ts
const whichResult = await runSh("which mkcert 2>/dev/null").catch(() => "");
const isInstalled = whichResult.trim().length > 0;

const caRoot = isInstalled
  ? await runSh("mkcert -CAROOT 2>/dev/null").catch(() => "")
  : "";
const isCAInstalled = caRoot.trim().length > 0;
```

**CA installation:**
```ts
async function installCA() {
  await runSh("mkcert -install");
  await checkInstallation(); // refresh state
}
```

**Cert generation:**
```ts
async function generateCert(domain: string) {
  const certDir = await getCertDir(domain);
  await runSh(`mkdir -p "${certDir}"`);
  const certPath = getCertPath(certDir);
  const keyPath = getKeyPath(certDir);
  await runSh(
    `mkcert -cert-file "${certPath}" -key-file "${keyPath}" "${domain}" localhost 127.0.0.1`
  );
  return { certPath, keyPath };
}
```

**Expiry check:**
```ts
async function checkExpiry(certPath: string): Promise<string | null> {
  try {
    const out = await runSh(`openssl x509 -enddate -noout -in "${certPath}"`);
    // Parse "notAfter=Jan  1 00:00:00 2028 GMT"
    const match = out.match(/notAfter=(.+)/);
    return match ? new Date(match[1]).toISOString() : null;
  } catch { return null; }
}
```

**Cert status scan:**
```ts
async function getCertStatus(domain: string) {
  const certDir = await getCertDir(domain);
  const certPath = getCertPath(certDir);
  try {
    await runSh(`test -f "${certPath}"`);
    const expiry = await checkExpiry(certPath);
    return { exists: true, expiry };
  } catch {
    return { exists: false, expiry: null };
  }
}
```

**Delete cert:**
```ts
async function deleteCert(domain: string) {
  const certDir = await getCertDir(domain);
  await runSh(`rm -rf "${certDir}"`);
}
```

### 2. Integrate with `use-local-domains.ts`

Update `useLocalDomains` to call `useMkcert().getCertStatus(domain)` when building domain list. Populate `certExists` and `certExpiry` fields on `LocalDomain`.

### 3. Expiry warning logic

```ts
function isExpiringSoon(expiry: string | null, daysThreshold = 30): boolean {
  if (!expiry) return false;
  const diff = new Date(expiry).getTime() - Date.now();
  return diff < daysThreshold * 86400000;
}
```

## Todo List

- [ ] Create `use-mkcert.ts` with detection, CA install, cert generation
- [ ] Add expiry check via openssl
- [ ] Add cert deletion
- [ ] Add `getCertStatus` for domain list enrichment
- [ ] Integrate cert status into `useLocalDomains` domain list
- [ ] Add expiry warning helper (< 30 days)

## Success Criteria

- mkcert detection correctly identifies installed/not-installed state
- CA installation triggers native Keychain dialog (no sudo)
- Cert generated at expected path with correct domain SANs
- Expiry date parsed correctly from openssl output
- Cert deletion removes entire domain cert directory
- No cert/key content logged to console

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| mkcert not installed | Feature unusable | Show install instructions: `brew install mkcert` |
| CA install fails (permissions) | Certs untrusted | Surface error, guide user to manual `mkcert -install` |
| openssl not available | Expiry unknown | macOS ships openssl by default; fallback to null |
| Cert dir permissions | Can't write cert | Use app data dir (user-writable); show error if fails |

## Security Considerations

- Never log cert/key file contents
- Cert output paths hardcoded to app data dir; user cannot override
- Domain validated via Phase 1 `validateDomain` before shell interpolation
- All paths quoted in shell commands to prevent injection

## Next Steps

Phase 3 adds reverse proxy config generation using cert paths from this phase.

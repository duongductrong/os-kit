# Phase 3: Reverse Proxy Config Generation

## Context Links

- [Plan](./plan.md)
- [Phase 2: SSL Certificate Management](./phase-02-ssl-certificate-management.md)
- [Research: Reverse Proxy](./research/researcher-02-reverse-proxy-config.md)

## Overview

Detect installed proxy server (Caddy/Nginx), generate config snippets with cert paths and port, offer copy-to-clipboard and optional direct write + reload.

## Key Insights

- Caddy config is 3 lines; Nginx ~15 lines
- Detection: `which caddy/nginx` and `pgrep -x caddy/nginx`
- Caddy reload: `caddy reload --config /path/to/Caddyfile` (no sudo)
- Nginx reload: `nginx -t && sudo nginx -s reload` (needs sudo for port 443)
- macOS Homebrew paths: Caddy at `/opt/homebrew/etc/Caddyfile`, Nginx at `/opt/homebrew/etc/nginx/servers/`
- Clipboard fallback when no write perms or proxy not installed

## Requirements

1. Detect Caddy and/or Nginx installation
2. Check if either is currently running
3. Generate Caddy config snippet from template
4. Generate Nginx config snippet from template
5. Copy snippet to clipboard
6. Optional: write config file directly + reload proxy
7. Show appropriate UI based on what's installed

## Architecture

```
proxy-templates.ts       Pure template functions (Caddy + Nginx)
use-proxy-detection.ts   Hook: detect installed proxies
```

## Related Code Files

- `src/hooks/use-config-file.ts` -- `runSh()` helper
- `src/features/local-domains/utils/cert-paths.ts` -- cert path resolution

## Implementation Steps

### 1. Create `src/features/local-domains/utils/proxy-templates.ts` (~60 lines)

```ts
interface ProxyTemplateVars {
  domain: string;
  port: number;
  certPath: string;
  keyPath: string;
}

export function generateCaddyConfig(vars: ProxyTemplateVars): string {
  return `${vars.domain} {
  tls ${vars.certPath} ${vars.keyPath}
  reverse_proxy localhost:${vars.port}
}`;
}

export function generateNginxConfig(vars: ProxyTemplateVars): string {
  return `server {
    listen 443 ssl;
    server_name ${vars.domain};

    ssl_certificate     ${vars.certPath};
    ssl_certificate_key ${vars.keyPath};

    location / {
        proxy_pass       http://localhost:${vars.port};
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}`;
}

export function getCaddyConfigPath(): string {
  return "/opt/homebrew/etc/Caddyfile";
}

export function getNginxConfigPath(domain: string): string {
  return `/opt/homebrew/etc/nginx/servers/${domain}.conf`;
}
```

### 2. Create `src/features/local-domains/hooks/use-proxy-detection.ts` (~80 lines)

```ts
interface ProxyStatus {
  caddy: { installed: boolean; running: boolean; path: string | null };
  nginx: { installed: boolean; running: boolean; path: string | null };
  isChecking: boolean;
}

export function useProxyDetection() {
  // On mount: detect both proxies
  // Returns: ProxyStatus + refresh()
}
```

**Detection logic:**
```ts
async function detectProxy(name: "caddy" | "nginx") {
  const whichResult = await runSh(`which ${name} 2>/dev/null`).catch(() => "");
  const installed = whichResult.trim().length > 0;
  const running = installed
    ? (await runSh(`pgrep -x ${name} 2>/dev/null`).catch(() => "")).trim().length > 0
    : false;
  return { installed, running, path: installed ? whichResult.trim() : null };
}
```

### 3. Clipboard copy

Use Tauri clipboard API or fallback:
```ts
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
// or fallback: navigator.clipboard.writeText(text)
```

If `@tauri-apps/plugin-clipboard-manager` not available, use `runSh("pbcopy")` with piped input.

### 4. Optional: write config + reload

**Caddy** (no sudo needed for config write if Homebrew-owned):
```ts
async function applyCaddyConfig(snippet: string) {
  const configPath = getCaddyConfigPath();
  // Append to Caddyfile (don't overwrite existing blocks)
  const current = await runSh(`cat "${configPath}" 2>/dev/null`).catch(() => "");
  const updated = current.trimEnd() + "\n\n" + snippet + "\n";
  await runSh(`echo '${btoa(updated)}' | base64 -d > "${configPath}"`);
  await runSh("caddy reload --config " + configPath);
}
```

**Nginx** (sudo for reload):
```ts
async function applyNginxConfig(domain: string, snippet: string) {
  const configPath = getNginxConfigPath(domain);
  await runSh(`echo '${btoa(snippet)}' | base64 -d > "${configPath}"`);
  await runSh("nginx -t"); // validate first
  await runSh(`osascript -e 'do shell script "nginx -s reload" with administrator privileges'`);
}
```

### 5. Integrate with `use-local-domains.ts`

Add `proxyType` field to `LocalDomain`. Check if a config file exists for domain:
- Caddy: grep Caddyfile for domain block
- Nginx: check `/opt/homebrew/etc/nginx/servers/<domain>.conf` exists

## Todo List

- [ ] Create `proxy-templates.ts` with Caddy and Nginx template generators
- [ ] Create `use-proxy-detection.ts` hook with detection logic
- [ ] Add clipboard copy for config snippets
- [ ] Add optional direct config write + reload for Caddy
- [ ] Add optional direct config write + reload for Nginx (with sudo)
- [ ] Integrate proxy status into `LocalDomain` type

## Success Criteria

- Correctly detects Caddy/Nginx installation and running state
- Generated Caddy config is valid (3 lines with correct cert paths)
- Generated Nginx config is valid (passes `nginx -t`)
- Clipboard copy works for both snippets
- Config write + reload succeeds when proxy is installed

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Overwriting existing Caddyfile entries | Config corruption | Append only; check for existing domain block first |
| nginx -s reload needs sudo | Extra auth prompt | Use osascript elevation |
| Homebrew paths differ on Intel Macs | Binary not found | Check both `/opt/homebrew/bin` and `/usr/local/bin` |
| Neither proxy installed | Feature limited | Clipboard-only mode with install instructions |

## Security Considerations

- Config snippets contain cert paths but not cert contents
- Domain and port values validated before template interpolation
- No arbitrary user input in shell commands beyond validated domain/port
- Nginx reload via osascript (native auth dialog)

## Next Steps

Phase 4 builds the UI that ties all three hooks together into a single management page.

---
title: "Local Domains & SSL"
description: "Manage custom local domains with HTTPS and reverse proxy support"
status: pending
priority: P2
effort: 10h
branch: master
tags: [local-domains, ssl, mkcert, hosts, reverse-proxy]
created: 2026-02-28
---

# Local Domains & SSL

Unified page to create custom local domains (e.g. `myapp.local`) mapped to 127.0.0.1 via /etc/hosts, generate trusted SSL certs via mkcert, and optionally configure reverse proxy (Caddy/Nginx) routing domain:443 to localhost:PORT.

## Phases

| # | Phase | Effort | Status | File |
|---|-------|--------|--------|------|
| 1 | Core domain management hook & utils | 2.5h | pending | [phase-01](./phase-01-core-domain-management.md) |
| 2 | SSL certificate management | 2.5h | pending | [phase-02](./phase-02-ssl-certificate-management.md) |
| 3 | Reverse proxy config generation | 2h | pending | [phase-03](./phase-03-reverse-proxy-config.md) |
| 4 | UI components & route | 3h | pending | [phase-04](./phase-04-ui-components-route.md) |

## Key Decisions

- **mkcert** for SSL (brew-installable, auto-trusted local CA)
- Integrated /etc/hosts management with `# oskit-managed` markers
- Both Caddy and Nginx supported; config snippets generated, detect which installed
- macOS (darwin) only
- Cert storage: `~/Library/Application Support/oskit/certs/<domain>/`
- Reuse existing `useConfigFile`, `useHostsFile`, `runSh` patterns

## Validated Decisions (Interview 2026-02-28)

- **Domain TLDs**: Any valid TLD allowed (no restriction to .local only)
- **Cert cleanup on removal**: Prompt user whether to also delete certs
- **Proxy config**: Clipboard-only (generate snippets, no direct file write/reload)
- **DNS flush**: Combined with hosts save in single osascript call (one auth prompt)

## New Files

```
src/features/local-domains/
  components/
    local-domains-manager.tsx      # Main page component
    domain-list-section.tsx         # Domain list with status indicators
    add-domain-form.tsx             # Add domain form
    proxy-config-dialog.tsx         # Proxy snippet display/copy
  hooks/
    use-local-domains.ts            # Compose hosts + mkcert + proxy
    use-mkcert.ts                   # mkcert CLI operations
    use-proxy-detection.ts          # Detect Caddy/Nginx
  utils/
    validate-domain.ts              # Domain validation & shell sanitization
    proxy-templates.ts              # Caddy/Nginx config templates
    cert-paths.ts                   # Cert storage path helpers
src/routes/local-domains.tsx        # Route file
```

## Research

- [mkcert, /etc/hosts, Tauri Shell](./research/researcher-01-mkcert-hosts-tauri-shell.md)
- [Reverse Proxy Config](./research/researcher-02-reverse-proxy-config.md)

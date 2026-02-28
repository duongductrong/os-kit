# Phase 4: UI Components & Route

## Context Links

- [Plan](./plan.md)
- [Phase 1](./phase-01-core-domain-management.md) | [Phase 2](./phase-02-ssl-certificate-management.md) | [Phase 3](./phase-03-reverse-proxy-config.md)
- Existing UI reference: `src/features/hosts/components/hosts-editor.tsx`

## Overview

Build the page UI: main manager component, domain list with status indicators, add domain form, proxy config dialog. Wire to route `/local-domains` and add sidebar entry.

## Key Insights

- Follow `hosts-editor.tsx` patterns exactly: Section/SectionContent/SectionItem components, warning banner, toolbar
- Split into 4 components to stay under 200 lines each
- Status indicators per domain: hosts (checkmark), cert (lock), proxy (server icon)
- mkcert install prompt shown if binary not found
- Actions per domain: generate cert, view/copy proxy config, delete

## Requirements

1. Main page component with loading/error states
2. mkcert installation status banner (install prompt if missing)
3. Domain list showing all oskit-managed domains with status badges
4. Add domain form (domain name + target port)
5. Per-domain actions: generate cert, copy proxy config, remove domain
6. Proxy config dialog/section showing generated snippet with copy button
7. Route at `/local-domains`
8. Sidebar entry between "Hosts" and "Ports"

## Architecture

```
local-domains-manager.tsx   Main component, composes sub-components
domain-list-section.tsx     Domain list with status indicators
add-domain-form.tsx         Add domain form
proxy-config-dialog.tsx     Proxy snippet display + copy
```

## Related Code Files

- `src/features/hosts/components/hosts-editor.tsx` -- UI pattern reference
- `src/components/ui/section.tsx` -- Section components
- `src/components/ui/button.tsx`, `input.tsx`, `switch.tsx` -- UI primitives
- `src/components/app-sidebar.tsx` -- Sidebar nav (line 55-61, between Hosts and Ports)
- `src/routes/hosts.tsx` -- Route pattern reference

## Implementation Steps

### 1. Create `src/routes/local-domains.tsx` (~25 lines)

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { LocalDomainsManager } from "@/features/local-domains/components/local-domains-manager";

export const Route = createFileRoute("/local-domains")({ component: Page });

export default function Page() {
  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Local Domains & SSL</h1>
        <p className="text-sm text-muted-foreground">
          Manage custom local domains with HTTPS certificates and reverse proxy configuration.
        </p>
      </div>
      <LocalDomainsManager />
    </div>
  );
}
```

### 2. Create `src/features/local-domains/components/local-domains-manager.tsx` (~120 lines)

Main orchestrator component:

```tsx
export function LocalDomainsManager() {
  const { domains, isLoading, error, addDomain, removeDomain, ... } = useLocalDomains();
  const mkcert = useMkcert();
  const proxy = useProxyDetection();

  // Render:
  // 1. Warning banner (admin password required for hosts changes)
  // 2. mkcert status banner (install prompt if not found)
  // 3. Toolbar (refresh button)
  // 4. <DomainListSection domains={domains} ... />
  // 5. <AddDomainForm onAdd={addDomain} />
}
```

**mkcert banner states:**
- Not installed: amber banner with `brew install mkcert` instruction
- Installed, CA not set up: blue banner with "Install CA" button
- Ready: no banner (or green subtle indicator)

### 3. Create `src/features/local-domains/components/domain-list-section.tsx` (~130 lines)

```tsx
interface DomainListSectionProps {
  domains: LocalDomain[];
  onGenerateCert: (domain: string) => void;
  onShowProxy: (domain: string) => void;
  onRemove: (domain: string) => void;
  isProcessing: boolean;
}
```

Per-domain row layout:
```
[domain.local]  :3000  [hosts checkmark] [cert lock] [proxy icon]  [Actions v]
```

Status indicators:
- Hosts: green checkmark if hostsEnabled, gray if not
- Cert: green lock if certExists + not expiring, amber if expiring, gray if missing
- Proxy: green server icon if proxyConfigured, gray if not

Actions (dropdown or inline buttons):
- "Generate SSL Cert" (if no cert)
- "Regenerate Cert" (if cert exists)
- "Proxy Config" (opens proxy dialog)
- "Remove" (destructive, removes hosts entry + optionally cert)

### 4. Create `src/features/local-domains/components/add-domain-form.tsx` (~70 lines)

```tsx
interface AddDomainFormProps {
  onAdd: (domain: string, port: number) => Promise<void>;
  isAdding: boolean;
}
```

Layout (inside SectionItem):
```
[Input: myapp.local]  [Input: 3000]  [Add button]
```

- Validate domain on blur/submit using `getDomainError()`
- Show inline error message below input
- Default port: 3000
- Clear form on successful add

### 5. Create `src/features/local-domains/components/proxy-config-dialog.tsx` (~100 lines)

```tsx
interface ProxyConfigDialogProps {
  domain: LocalDomain;
  proxyStatus: ProxyStatus;
  open: boolean;
  onClose: () => void;
}
```

Content:
- Tabs or toggle for Caddy / Nginx (show both if both installed, default to installed one)
- Read-only code block with generated config
- "Copy to Clipboard" button
- If proxy installed + writable: "Apply & Reload" button
- If proxy not installed: install instruction text

Use a sheet/dialog from shadcn or simple expandable section.

### 6. Update sidebar: `src/components/app-sidebar.tsx`

Insert between "Hosts" (line 56) and "Ports" (line 58):

```tsx
{
  title: "Local Domains",
  url: "/local-domains",
},
```

### 7. Regenerate route tree

Run `pnpm dev` or the TanStack Router codegen to update `src/routeTree.gen.ts`.

## Todo List

- [ ] Create route file `src/routes/local-domains.tsx`
- [ ] Create `local-domains-manager.tsx` main component
- [ ] Create `domain-list-section.tsx` with status indicators
- [ ] Create `add-domain-form.tsx` with validation
- [ ] Create `proxy-config-dialog.tsx` with snippet display + copy
- [ ] Add sidebar entry in `app-sidebar.tsx`
- [ ] Regenerate route tree
- [ ] Verify all components under 200 lines

## Success Criteria

- Page loads at `/local-domains` without errors
- mkcert status banner shows correct state
- Can add a new domain (appears in list with hosts checkmark)
- Can generate cert (lock icon turns green)
- Can view and copy proxy config snippet
- Can remove domain (entry + cert cleaned up)
- Sidebar shows "Local Domains" between "Hosts" and "Ports"
- All component files under 200 lines

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Too many re-renders from 3 hooks | Performance | Memoize derived data, debounce status scans |
| Long cert generation blocks UI | Frozen UI | Show loading spinner per-domain action |
| Route tree codegen fails | Build error | Run `pnpm dev` to auto-regenerate |
| Component exceeds 200 lines | Rule violation | Split further (e.g., domain-status-badge.tsx) |

## Security Considerations

- No cert content displayed in UI
- Domain input sanitized before any shell command
- Cert paths displayed but not editable by user
- Remove action shows confirmation for destructive operations

## Next Steps

After all 4 phases complete: manual QA on macOS, verify hosts edit + mkcert cert gen + proxy snippet copy end-to-end. Consider follow-up: wildcard cert support, cert auto-renewal reminders, Firefox NSS trust automation.

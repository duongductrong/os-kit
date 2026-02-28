import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocalDomains } from "../hooks/use-local-domains";
import { useMkcert } from "../hooks/use-mkcert";
import { useProxyDetection } from "../hooks/use-proxy-detection";
import { useNginxProxy } from "../hooks/use-nginx-proxy";
import { DomainListSection } from "./domain-list-section";
import { AddDomainForm } from "./add-domain-form";
import { ProxyConfigDialog } from "./proxy-config-dialog";

export function LocalDomainsManager() {
  const {
    domains, isLoading, isSaving, isProcessing, error,
    domainError, setDomainError, addDomain, removeDomain, refresh,
  } = useLocalDomains();
  const mkcert = useMkcert();
  const proxyStatus = useProxyDetection();
  const nginxProxy = useNginxProxy();

  const [proxyDomain, setProxyDomain] = useState<string | null>(null);
  const [certGenerating, setCertGenerating] = useState(false);

  const selectedDomain = proxyDomain
    ? domains.find((d) => d.domain === proxyDomain) ?? null
    : null;

  const handleGenerateCert = useCallback(
    async (domain: string) => {
      setCertGenerating(true);
      try {
        await mkcert.generateCert(domain);
        await refresh();
      } catch (err) {
        setDomainError(err instanceof Error ? err.message : "Failed to generate cert");
      } finally {
        setCertGenerating(false);
      }
    },
    [mkcert, refresh, setDomainError],
  );

  const handleRemove = useCallback(
    async (domain: string) => {
      const cert = domains.find((d) => d.domain === domain);
      if (cert?.certExists) {
        const deleteCert = window.confirm(
          `Also delete SSL certificate for ${domain}?`,
        );
        if (deleteCert) {
          await mkcert.deleteCert(domain);
        }
      }
      // Also remove nginx proxy config if it exists
      if (cert?.proxyEnabled) {
        await nginxProxy.removeProxy(domain).catch(() => {});
      }
      await removeDomain(domain);
    },
    [domains, mkcert, nginxProxy, removeDomain],
  );

  const handleApplyNginx = useCallback(
    async (domain: string, port: number, useSsl: boolean) => {
      await nginxProxy.applyProxy(domain, port, useSsl);
      await refresh();
      await proxyStatus.refresh();
    },
    [nginxProxy, refresh, proxyStatus],
  );

  const handleRemoveNginx = useCallback(
    async (domain: string) => {
      await nginxProxy.removeProxy(domain);
      await refresh();
      await proxyStatus.refresh();
    },
    [nginxProxy, refresh, proxyStatus],
  );

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Loading /etc/hosts...
      </p>
    );
  }

  const busy = isSaving || isProcessing || certGenerating || nginxProxy.isApplying;

  return (
    <div className="flex flex-col gap-6">
      {/* Admin warning */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
        Editing hosts requires admin password. You'll be prompted when saving.
      </div>

      {/* mkcert status banner */}
      {mkcert.isChecking ? null : !mkcert.isInstalled ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <span className="font-medium">mkcert not found.</span> Install it to generate SSL certs:{" "}
          <code className="rounded bg-muted px-1 py-0.5">brew install mkcert</code>
        </div>
      ) : !mkcert.isCAInstalled ? (
        <div className="flex items-center justify-between rounded-lg border border-blue-500/30 bg-blue-500/5 px-4 py-3 text-sm text-blue-700 dark:text-blue-400">
          <span>Local CA not installed. Required to trust generated certificates.</span>
          <Button size="sm" variant="outline" onClick={mkcert.installCA}>
            Install CA
          </Button>
        </div>
      ) : null}

      {error && <p className="text-sm text-destructive">{error}</p>}
      {nginxProxy.error && <p className="text-sm text-destructive">{nginxProxy.error}</p>}

      {/* Toolbar */}
      <div className="flex items-center justify-end">
        <Button size="sm" variant="outline" onClick={refresh} disabled={busy}>
          Refresh
        </Button>
      </div>

      {/* Domain list */}
      <DomainListSection
        domains={domains}
        onGenerateCert={handleGenerateCert}
        onShowProxy={setProxyDomain}
        onRemove={handleRemove}
        isProcessing={busy}
      />

      {/* Add domain form */}
      <AddDomainForm
        onAdd={addDomain}
        isAdding={busy}
        externalError={domainError}
      />

      {/* Proxy config dialog */}
      {selectedDomain && (
        <ProxyConfigDialog
          domain={selectedDomain}
          proxyStatus={proxyStatus}
          onClose={() => setProxyDomain(null)}
          onApplyNginx={handleApplyNginx}
          onRemoveNginx={handleRemoveNginx}
          isApplying={nginxProxy.isApplying}
        />
      )}
    </div>
  );
}

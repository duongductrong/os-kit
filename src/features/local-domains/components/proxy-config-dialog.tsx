import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Section,
  SectionContent,
  SectionHeader,
  SectionItem,
  SectionItemControl,
  SectionItemLabel,
  SectionTitle,
} from "@/components/ui/section";
import type { LocalDomain } from "../hooks/use-local-domains";
import type { ProxyStatus } from "../hooks/use-proxy-detection";
import { generateCaddyConfig, generateNginxConfig, generateNginxHttpConfig } from "../utils/proxy-templates";
import { getCertDir, getCertPath, getKeyPath } from "../utils/cert-paths";

interface ProxyConfigDialogProps {
  domain: LocalDomain | null;
  proxyStatus: ProxyStatus;
  onClose: () => void;
  onApplyNginx: (domain: string, port: number, useSsl: boolean) => Promise<void>;
  onRemoveNginx: (domain: string) => Promise<void>;
  isApplying: boolean;
}

type ProxyTab = "caddy" | "nginx";
type NginxMode = "http" | "ssl";

export function ProxyConfigDialog({
  domain,
  proxyStatus,
  onClose,
  onApplyNginx,
  onRemoveNginx,
  isApplying,
}: ProxyConfigDialogProps) {
  const [activeTab, setActiveTab] = useState<ProxyTab>(
    proxyStatus.caddy.installed ? "caddy" : "nginx",
  );
  const [nginxMode, setNginxMode] = useState<NginxMode>("http");
  const [copied, setCopied] = useState(false);
  const [certDir, setCertDir] = useState<string | null>(null);

  // Resolve cert dir on mount
  if (domain && !certDir) {
    getCertDir(domain.domain).then(setCertDir);
  }

  if (!domain) return null;

  const certPath = certDir ? getCertPath(certDir) : "<cert-path>";
  const keyPath = certDir ? getKeyPath(certDir) : "<key-path>";

  const vars = { domain: domain.domain, port: domain.port, certPath, keyPath };

  const getSnippet = () => {
    if (activeTab === "caddy") return generateCaddyConfig(vars);
    return nginxMode === "ssl"
      ? generateNginxConfig(vars)
      : generateNginxHttpConfig({ domain: domain.domain, port: domain.port });
  };

  const snippet = getSnippet();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => onApplyNginx(domain.domain, domain.port, nginxMode === "ssl");
  const handleRemove = () => onRemoveNginx(domain.domain);

  return (
    <Section>
      <SectionHeader>
        <div className="flex items-center justify-between">
          <SectionTitle>Proxy Config: {domain.domain}</SectionTitle>
          <Button size="sm" variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </SectionHeader>
      <SectionContent>
        {/* Tab toggle */}
        <SectionItem>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={activeTab === "caddy" ? "default" : "outline"}
              onClick={() => setActiveTab("caddy")}
            >
              Caddy
              {proxyStatus.caddy.installed && (
                <span className="ml-1 text-[10px] opacity-60">installed</span>
              )}
            </Button>
            <Button
              size="sm"
              variant={activeTab === "nginx" ? "default" : "outline"}
              onClick={() => setActiveTab("nginx")}
            >
              Nginx
              {proxyStatus.nginx.installed && (
                <span className="ml-1 text-[10px] opacity-60">installed</span>
              )}
            </Button>
          </div>
          <SectionItemControl>
            <Button size="sm" variant="outline" onClick={handleCopy}>
              {copied ? "Copied!" : "Copy"}
            </Button>
          </SectionItemControl>
        </SectionItem>

        {/* Nginx mode toggle (HTTP vs SSL) */}
        {activeTab === "nginx" && (
          <SectionItem>
            <SectionItemLabel>
              <span className="text-xs text-muted-foreground">Mode</span>
            </SectionItemLabel>
            <SectionItemControl>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={nginxMode === "http" ? "default" : "outline"}
                  onClick={() => setNginxMode("http")}
                >
                  HTTP (port 80)
                </Button>
                <Button
                  size="sm"
                  variant={nginxMode === "ssl" ? "default" : "outline"}
                  onClick={() => setNginxMode("ssl")}
                  disabled={!domain.certExists}
                >
                  HTTPS (port 443)
                </Button>
              </div>
            </SectionItemControl>
          </SectionItem>
        )}

        {/* Config snippet */}
        <SectionItem>
          <SectionItemLabel>
            <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs font-mono whitespace-pre">
              {snippet}
            </pre>
          </SectionItemLabel>
        </SectionItem>

        {/* Nginx apply/remove actions */}
        {activeTab === "nginx" && proxyStatus.nginx.installed && (
          <SectionItem>
            <SectionItemLabel>
              <span className="text-xs text-muted-foreground">
                {domain.proxyEnabled
                  ? "Nginx proxy is active for this domain."
                  : "Apply config to nginx and reload."}
              </span>
            </SectionItemLabel>
            <SectionItemControl>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleApply}
                  disabled={isApplying}
                >
                  {domain.proxyEnabled ? "Reapply" : "Apply"}
                </Button>
                {domain.proxyEnabled && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={handleRemove}
                    disabled={isApplying}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </SectionItemControl>
          </SectionItem>
        )}

        {/* Install hint if proxy not installed */}
        {!proxyStatus.caddy.installed && !proxyStatus.nginx.installed && (
          <SectionItem>
            <SectionItemLabel>
              <p className="text-xs text-muted-foreground">
                No proxy server detected. Install one:
                <code className="ml-1 rounded bg-muted px-1 py-0.5">brew install caddy</code> or
                <code className="ml-1 rounded bg-muted px-1 py-0.5">brew install nginx</code>
              </p>
            </SectionItemLabel>
          </SectionItem>
        )}

        {nginxMode === "ssl" && !domain.certExists && (
          <SectionItem>
            <SectionItemLabel>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Generate an SSL certificate first before using HTTPS mode.
              </p>
            </SectionItemLabel>
          </SectionItem>
        )}
      </SectionContent>
    </Section>
  );
}

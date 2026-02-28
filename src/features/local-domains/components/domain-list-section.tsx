import { Button } from "@/components/ui/button";
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionItem,
  SectionItemControl,
  SectionItemLabel,
  SectionTitle,
} from "@/components/ui/section";
import type { LocalDomain } from "../hooks/use-local-domains";
import { isExpiringSoon } from "../utils/cert-paths";

interface DomainListSectionProps {
  domains: LocalDomain[];
  onGenerateCert: (domain: string) => void;
  onShowProxy: (domain: string) => void;
  onRemove: (domain: string) => void;
  isProcessing: boolean;
}

function StatusBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
        active
          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {label}
    </span>
  );
}

function ExpiryBadge({ expiry }: { expiry: string | null }) {
  if (!expiry) return null;
  const expiring = isExpiringSoon(expiry);
  return (
    <span
      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
        expiring
          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
          : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
      }`}
    >
      {expiring ? "Expiring soon" : `Expires ${new Date(expiry).toLocaleDateString()}`}
    </span>
  );
}

export function DomainListSection({
  domains,
  onGenerateCert,
  onShowProxy,
  onRemove,
  isProcessing,
}: DomainListSectionProps) {
  return (
    <Section>
      <SectionHeader>
        <SectionTitle>Managed Domains</SectionTitle>
        <SectionDescription>
          Custom domains mapped to 127.0.0.1 via /etc/hosts
        </SectionDescription>
      </SectionHeader>
      <SectionContent>
        {domains.length === 0 && (
          <SectionItem>
            <SectionItemLabel>
              <p className="text-sm text-muted-foreground">
                No managed domains yet. Add one below.
              </p>
            </SectionItemLabel>
          </SectionItem>
        )}
        {domains.map((d) => (
          <SectionItem key={d.domain}>
            <SectionItemLabel>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{d.domain}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  :{d.port || "—"}
                </span>
                <StatusBadge active={d.hostsEnabled} label="Hosts" />
                <StatusBadge active={d.certExists} label="SSL" />
                <StatusBadge active={d.proxyEnabled} label="Proxy" />
                {d.certExists && <ExpiryBadge expiry={d.certExpiry} />}
              </div>
            </SectionItemLabel>
            <SectionItemControl>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onGenerateCert(d.domain)}
                disabled={isProcessing}
              >
                {d.certExists ? "Regen Cert" : "Gen Cert"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onShowProxy(d.domain)}
                disabled={isProcessing}
              >
                Proxy
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={() => onRemove(d.domain)}
                disabled={isProcessing}
              >
                Remove
              </Button>
            </SectionItemControl>
          </SectionItem>
        ))}
      </SectionContent>
    </Section>
  );
}

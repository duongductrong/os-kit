import { createFileRoute } from "@tanstack/react-router";
import { LocalDomainsManager } from "@/features/local-domains/components/local-domains-manager";

export const Route = createFileRoute("/local-domains")({
  component: LocalDomainsPage,
});

export default function LocalDomainsPage() {
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

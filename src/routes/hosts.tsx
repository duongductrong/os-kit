import { createFileRoute } from "@tanstack/react-router";
import { HostsEditor } from "@/features/hosts/components/hosts-editor";

export const Route = createFileRoute("/hosts")({
  component: HostsPage,
});

export default function HostsPage() {
  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Hosts</h1>
        <p className="text-sm text-muted-foreground">
          Visual editor for /etc/hosts — toggle entries, add custom host mappings.
        </p>
      </div>
      <HostsEditor />
    </div>
  );
}

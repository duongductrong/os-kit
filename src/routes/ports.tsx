import { createFileRoute } from "@tanstack/react-router";
import { PortManager } from "@/features/ports/components/port-manager";

export const Route = createFileRoute("/ports")({
  component: PortsPage,
});

export default function PortsPage() {
  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Port Manager</h1>
        <p className="text-sm text-muted-foreground">
          View listening ports, kill processes, and open in browser.
        </p>
      </div>
      <PortManager />
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { SystemInfoDashboard } from "@/features/system-info/components/system-info-dashboard";

export const Route = createFileRoute("/system-info")({
  component: SystemInfoPage,
});

export default function SystemInfoPage() {
  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">System Info</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your macOS system, hardware, and developer tools.
        </p>
      </div>
      <SystemInfoDashboard />
    </div>
  );
}

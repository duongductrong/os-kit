import { createFileRoute } from "@tanstack/react-router";
import { SshManager } from "@/features/ssh/components/ssh-manager";

export const Route = createFileRoute("/ssh")({
  component: SshPage,
});

export default function SshPage() {
  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">SSH</h1>
        <p className="text-sm text-muted-foreground">
          Manage SSH keys and edit ~/.ssh/config host entries.
        </p>
      </div>
      <SshManager />
    </div>
  );
}

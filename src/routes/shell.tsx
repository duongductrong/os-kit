import { createFileRoute } from "@tanstack/react-router";
import { ZshrcEditor } from "@/features/shell/components/zshrc-editor";

export const Route = createFileRoute("/shell")({
  component: Shell,
});

export default function Shell() {
  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto w-full">
      {/* Page header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Shell Configuration
        </h1>
        <p className="text-sm text-muted-foreground">
          View and edit your{" "}
          <code className="font-mono font-semibold">~/.zshrc</code> file. Manage
          environment variables, aliases, PATH entries, and shell plugins.
        </p>
      </div>

      <ZshrcEditor />
    </div>
  );
}

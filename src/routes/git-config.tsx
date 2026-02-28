import { createFileRoute } from "@tanstack/react-router";
import { GitConfigEditor } from "@/features/git-config/components/git-config-editor";

export const Route = createFileRoute("/git-config")({
  component: GitConfigPage,
});

export default function GitConfigPage() {
  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Git Config</h1>
        <p className="text-sm text-muted-foreground">
          Visual editor for ~/.gitconfig — manage your Git identity, aliases, and settings.
        </p>
      </div>
      <GitConfigEditor />
    </div>
  );
}

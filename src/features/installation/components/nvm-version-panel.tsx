import { useNvmVersions } from "@/hooks/use-nvm-versions";
import { cn } from "@/lib/utils";

export function NvmVersionPanel() {
  const { versions, loading } = useNvmVersions();

  if (loading) {
    return (
      <div className="px-4 py-3 text-xs text-muted-foreground animate-pulse">
        Loading Node.js versions…
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="px-4 py-3 text-xs text-muted-foreground">
        No Node.js versions installed via nvm. Use{" "}
        <code className="rounded bg-muted px-1">
          nvm install &lt;version&gt;
        </code>{" "}
        to add one.
      </div>
    );
  }

  return (
    <div className="px-4 py-3">
      <div className="text-xs font-medium text-muted-foreground mb-2">
        Installed Node.js versions
      </div>
      <div className="flex flex-wrap gap-1.5">
        {versions.map((v) => (
          <span
            key={v.version}
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-mono",
              v.isCurrent
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30"
                : "bg-muted text-muted-foreground",
            )}
          >
            {v.isCurrent && (
              <span className="size-1.5 rounded-full bg-emerald-500" />
            )}
            {v.version}
          </span>
        ))}
      </div>
    </div>
  );
}

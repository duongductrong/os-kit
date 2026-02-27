import { Button } from "@/components/ui/button";
import {
  SectionItem,
  SectionItemControl,
  SectionItemLabel,
} from "@/components/ui/section";
import type { InstallTool, ToolStatus } from "../utils/installation-data";

interface InstallationItemProps {
  tool: InstallTool;
  status: ToolStatus;
  onInstall: () => void;
  onRetry: () => void;
  disabled?: boolean;
}

export function InstallationItem({
  tool,
  status,
  onInstall,
  onRetry,
  disabled,
}: InstallationItemProps) {
  return (
    <SectionItem>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-base">
          {tool.icon}
        </span>
        <SectionItemLabel title={tool.name} description={tool.description} />
      </div>
      <SectionItemControl>
        <StatusAction
          status={status}
          onInstall={onInstall}
          onRetry={onRetry}
          disabled={disabled}
        />
      </SectionItemControl>
    </SectionItem>
  );
}

function StatusAction({
  status,
  onInstall,
  onRetry,
  disabled,
}: {
  status: ToolStatus;
  onInstall: () => void;
  onRetry: () => void;
  disabled?: boolean;
}) {
  switch (status) {
    case "idle":
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={onInstall}
          disabled={disabled}
        >
          Install
        </Button>
      );

    case "installing":
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span>Installing…</span>
        </div>
      );

    case "installed":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          <svg
            className="size-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Installed
        </span>
      );

    case "failed":
      return (
        <Button size="sm" variant="destructive" onClick={onRetry}>
          Retry
        </Button>
      );
  }
}

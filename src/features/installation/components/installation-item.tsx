import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SectionItem,
  SectionItemControl,
  SectionItemLabel,
} from "@/components/ui/section";
import type {
  InstallTool,
  ManagedBy,
  ToolAction,
  ToolStatus,
} from "../utils/installation-data";
import type { ToolLogState } from "@/hooks/use-tool-logs";
import { NvmVersionPanel } from "./nvm-version-panel";
import { TerminalLog } from "./terminal-log";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HugeiconsIcon } from "@hugeicons/react";
import { Setting07Icon } from "@hugeicons/core-free-icons";

/** Map well-known action IDs to SVG icon paths */
function ActionIcon({ actionId }: { actionId: string }) {
  switch (actionId) {
    case "upgrade":
      return (
        <svg
          className="size-4 mr-2"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="17 11 12 6 7 11" />
          <line x1="12" y1="18" x2="12" y2="6" />
        </svg>
      );
    case "uninstall":
      return (
        <svg
          className="size-4 mr-2"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      );
    default:
      // Generic gear icon for custom actions
      return (
        <svg
          className="size-4 mr-2"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
  }
}

interface InstallationItemProps {
  tool: InstallTool;
  status: ToolStatus;
  version: string | null;
  size: string | null;
  managedBy: ManagedBy;
  actions: ToolAction[];
  logState?: ToolLogState;
  onInstall: () => void;
  onRetry: () => void;
  onAction: (actionId: string) => void;
  onClearLog?: () => void;
  disabled?: boolean;
}

export function InstallationItem({
  tool,
  status,
  version,
  size,
  managedBy,
  actions,
  logState,
  onInstall,
  onRetry,
  onAction,
  onClearLog,
  disabled,
}: InstallationItemProps) {
  const [expanded, setExpanded] = useState(false);
  const showSettings = status === "installed" && actions.length > 0;

  return (
    <div>
      <SectionItem className="cursor-default">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-base">
            {tool.icon}
          </span>
          <SectionItemLabel description={tool.description}>
            <span className="text-sm font-medium leading-snug inline-flex items-center gap-2">
              {tool.name}
              {status === "installed" && version && (
                <span className="font-mono text-xs font-normal text-muted-foreground">
                  {version}
                </span>
              )}
              {status === "installed" && size && (
                <span className="font-mono text-[10px] font-normal text-muted-foreground/70">
                  {size}
                </span>
              )}
              {status === "installed" &&
                managedBy === "manual" &&
                tool.brewCaskName && (
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <span className="inline-flex items-center rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400 cursor-help">
                          Manual
                        </span>
                      }
                    />
                    <TooltipContent side="top">
                      Installed outside of Homebrew (e.g. via DMG).
                      <br />
                      Some actions like upgrade may not be available.
                    </TooltipContent>
                  </Tooltip>
                )}
            </span>
          </SectionItemLabel>
        </div>
        <SectionItemControl>
          <div className="flex items-center gap-1.5">
            {/* Expand detail chevron (nvm) */}
            {tool.hasDetails && status === "installed" && (
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={() => setExpanded(!expanded)}
                aria-label={expanded ? "Collapse details" : "Expand details"}
              >
                <svg
                  className={`size-3.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </Button>
            )}

            {/* Settings dropdown — driven by YAML actions */}
            {showSettings && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      aria-label="Tool settings"
                    >
                      <HugeiconsIcon
                        icon={Setting07Icon}
                        className="size-4 text-muted-foreground"
                      />
                    </Button>
                  }
                />
                <DropdownMenuContent
                  align="end"
                  side="bottom"
                  sideOffset={4}
                  className="w-[168px]"
                >
                  {actions.map((action) => (
                    <div key={action.id}>
                      {action.separatorBefore && <DropdownMenuSeparator />}
                      <DropdownMenuItem
                        variant={
                          action.variant === "destructive"
                            ? "destructive"
                            : undefined
                        }
                        onClick={() => onAction(action.id)}
                      >
                        <ActionIcon actionId={action.id} />
                        {action.label}
                      </DropdownMenuItem>
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Status badge / action */}
            <StatusAction
              status={status}
              onInstall={onInstall}
              onRetry={onRetry}
              disabled={disabled}
            />
          </div>
        </SectionItemControl>
      </SectionItem>

      {/* Terminal log panel */}
      {logState && onClearLog && (
        <TerminalLog logState={logState} onClear={onClearLog} />
      )}

      {/* Expandable detail panel */}
      {tool.hasDetails && expanded && status === "installed" && (
        <div className="border-t border-border bg-muted/30">
          {tool.id === "nvm" && <NvmVersionPanel />}
        </div>
      )}
    </div>
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
          <span>Processing…</span>
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

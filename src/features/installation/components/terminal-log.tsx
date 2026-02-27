import { useEffect, useRef, useState } from "react";
import type { ToolLogState } from "@/hooks/use-tool-logs";

interface TerminalLogProps {
  logState: ToolLogState;
  onClear: () => void;
}

export function TerminalLog({ logState, onClear }: TerminalLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);

  // Auto-scroll to bottom on new entries
  useEffect(() => {
    if (!collapsed && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logState.entries.length, collapsed]);

  const hasEntries = logState.entries.length > 0;
  const isDone = !logState.isActive && logState.exitCode !== null;
  const isSuccess = isDone && logState.exitCode === 0;
  const isError = isDone && logState.exitCode !== 0;

  if (!hasEntries && !logState.isActive) return null;

  return (
    <div className="border-t border-border overflow-hidden animate-in slide-in-from-top-1 duration-200">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-secondary border-b border-border">
        <div className="flex items-center gap-2">
          {logState.isActive && (
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-foreground/40 opacity-75" />
              <span className="relative inline-flex rounded-full size-2 bg-accent-foreground/60" />
            </span>
          )}
          {isSuccess && (
            <svg
              className="size-3.5 text-emerald-500 dark:text-emerald-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          {isError && (
            <svg
              className="size-3.5 text-destructive"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )}
          <span className="text-[11px] font-medium text-muted-foreground font-mono select-none">
            {logState.isActive && "Running…"}
            {isSuccess && "Completed successfully"}
            {isError && `Failed (exit code ${logState.exitCode})`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
            aria-label={collapsed ? "Expand log" : "Collapse log"}
          >
            <svg
              className={`size-3.5 transition-transform duration-200 ${collapsed ? "" : "rotate-180"}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {isDone && (
            <button
              onClick={onClear}
              className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
              aria-label="Clear log"
            >
              <svg
                className="size-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Log content */}
      {!collapsed && (
        <div
          ref={scrollRef}
          className="bg-muted max-h-48 overflow-y-auto overflow-x-hidden scroll-smooth"
        >
          <div className="p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all">
            {logState.entries.map((entry, i) => (
              <span
                key={i}
                className={
                  entry.stream === "stderr"
                    ? "text-destructive"
                    : "text-foreground"
                }
              >
                {entry.text}
              </span>
            ))}
            {logState.isActive && (
              <span className="inline-block w-1.5 h-3.5 bg-muted-foreground animate-pulse ml-0.5 align-text-bottom" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

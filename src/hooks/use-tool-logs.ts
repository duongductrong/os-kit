import { useCallback, useRef, useState } from "react";

export interface ToolLogEntry {
  text: string;
  stream: "stdout" | "stderr";
  timestamp: number;
}

export interface ToolLogState {
  entries: ToolLogEntry[];
  isActive: boolean;
  exitCode: number | null;
}

const emptyLog = (): ToolLogState => ({
  entries: [],
  isActive: false,
  exitCode: null,
});

/**
 * Centralized hook for managing per-tool terminal log output.
 * Uses a ref + batched setState to avoid re-render storms from rapid streaming.
 */
export function useToolLogs() {
  const [logsMap, setLogsMap] = useState<Record<string, ToolLogState>>({});
  const pendingRef = useRef<Record<string, ToolLogEntry[]>>({});
  const rafRef = useRef<number | null>(null);

  // Flush all pending entries into state in a single batch
  const flush = useCallback(() => {
    const pending = pendingRef.current;
    pendingRef.current = {};
    rafRef.current = null;

    setLogsMap((prev) => {
      const next = { ...prev };
      for (const [toolId, entries] of Object.entries(pending)) {
        const existing = next[toolId] ?? emptyLog();
        next[toolId] = {
          ...existing,
          entries: [...existing.entries, ...entries],
        };
      }
      return next;
    });
  }, []);

  const appendLog = useCallback(
    (toolId: string, entry: ToolLogEntry) => {
      if (!pendingRef.current[toolId]) {
        pendingRef.current[toolId] = [];
      }
      pendingRef.current[toolId].push(entry);

      // Schedule a flush on the next animation frame (batches rapid updates)
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(flush);
      }
    },
    [flush],
  );

  const startLog = useCallback((toolId: string) => {
    setLogsMap((prev) => ({
      ...prev,
      [toolId]: { entries: [], isActive: true, exitCode: null },
    }));
  }, []);

  const endLog = useCallback((toolId: string, exitCode: number) => {
    // Flush any remaining pending entries first
    const pending = pendingRef.current[toolId];
    delete pendingRef.current[toolId];

    setLogsMap((prev) => {
      const existing = prev[toolId] ?? emptyLog();
      return {
        ...prev,
        [toolId]: {
          entries: pending
            ? [...existing.entries, ...pending]
            : existing.entries,
          isActive: false,
          exitCode,
        },
      };
    });
  }, []);

  const clearLog = useCallback((toolId: string) => {
    setLogsMap((prev) => {
      const next = { ...prev };
      delete next[toolId];
      return next;
    });
  }, []);

  return { logsMap, appendLog, startLog, endLog, clearLog };
}

import { Command } from "@tauri-apps/plugin-shell";
import { useCallback, useEffect, useRef, useState } from "react";
import { parseLsof, type PortEntry } from "../utils/parse-lsof";

async function runSh(cmd: string) {
  const r = await Command.create("exec-sh", ["-c", cmd]).execute();
  return r;
}

export function usePortScanner() {
  const [ports, setPorts] = useState<PortEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(10000); // 10s default
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scan = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await runSh("lsof -i -P -n -sTCP:LISTEN 2>/dev/null");
      setPorts(parseLsof(result.stdout));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scan ports");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const killProcess = useCallback(
    async (pid: number) => {
      try {
        await runSh(`kill ${pid}`);
        // Re-scan after kill
        setTimeout(scan, 500);
      } catch (err) {
        setError(`Failed to kill PID ${pid}`);
        console.error(err);
      }
    },
    [scan],
  );

  // Initial scan
  useEffect(() => { scan(); }, [scan]);

  // Auto-refresh
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (autoRefresh) {
      intervalRef.current = setInterval(scan, refreshInterval);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, refreshInterval, scan]);

  return {
    ports, isLoading, error,
    scan, killProcess,
    autoRefresh, setAutoRefresh,
    refreshInterval, setRefreshInterval,
  };
}

import { Command } from "@tauri-apps/plugin-shell";
import { useCallback, useEffect, useState } from "react";
import { useSettings } from "@/contexts/settings-context";
import { scanAllDirectories, type ScannedProject } from "../utils/scan-directories";

async function runSh(cmd: string) {
  await Command.create("exec-sh", ["-c", cmd]).execute();
}

export function useProjectScanner() {
  const { settings } = useSettings();
  const [projects, setProjects] = useState<ScannedProject[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scan = useCallback(async () => {
    setIsScanning(true);
    setError(null);
    try {
      const results = await scanAllDirectories(
        settings.scanDirectories,
        settings.scanDepth,
      );
      setProjects(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setIsScanning(false);
    }
  }, [settings.scanDirectories, settings.scanDepth]);

  const openInIDE = useCallback(
    async (path: string, ide?: string) => {
      const cmd = ide || settings.preferredIDE;
      try {
        await runSh(`${cmd} "${path}"`);
      } catch (err) {
        console.error(`Failed to open in IDE (${cmd}):`, err);
      }
    },
    [settings.preferredIDE],
  );

  const openInTerminal = useCallback(async (path: string) => {
    try {
      await runSh(`open -a Terminal "${path}"`);
    } catch (err) {
      console.error("Failed to open terminal:", err);
    }
  }, []);

  const openInFinder = useCallback(async (path: string) => {
    try {
      await runSh(`open "${path}"`);
    } catch (err) {
      console.error("Failed to open Finder:", err);
    }
  }, []);

  // Scan on mount
  useEffect(() => {
    scan();
  }, [scan]);

  return {
    projects,
    isScanning,
    error,
    scan,
    openInIDE,
    openInTerminal,
    openInFinder,
  };
}

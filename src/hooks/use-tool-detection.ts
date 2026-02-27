import { Command } from "@tauri-apps/plugin-shell";
import { useCallback, useEffect, useState } from "react";
import type { ToolStatus } from "@/lib/types";

export interface ToolDetectionConfig {
  /** Unique tool identifier */
  id: string;
  /** Shell command to check if the tool is installed (should exit 0 if found) */
  checkCommand: string;
  /** Shell command to install the tool (runs via `sh -c`) */
  installCommand?: string;
}

/**
 * Generic hook to detect and install a CLI tool via Tauri's shell plugin.
 * Checks on mount by running the provided shell command.
 */
export function useToolDetection(config: ToolDetectionConfig) {
  const [status, setStatus] = useState<ToolStatus>("idle");
  const [checking, setChecking] = useState(true);

  const check = useCallback(async () => {
    setChecking(true);
    try {
      const result = await Command.create("exec-sh", [
        "-c",
        config.checkCommand,
      ]).execute();

      setStatus(result.code === 0 ? "installed" : "idle");
    } catch (error) {
      console.log(`useToolDetection(${config.id}):`, error);
      setStatus("idle");
    } finally {
      setChecking(false);
    }
  }, [config.checkCommand, config.id]);

  const install = useCallback(async () => {
    if (!config.installCommand) return;
    setStatus("installing");
    try {
      const result = await Command.create("exec-sh", [
        "-c",
        config.installCommand,
      ]).execute();

      if (result.code === 0) {
        setStatus("installed");
      } else {
        console.error(`Install ${config.id} failed:`, result.stderr);
        setStatus("failed");
      }
    } catch (err) {
      console.error(`Install ${config.id} error:`, err);
      setStatus("failed");
    }
  }, [config.id, config.installCommand]);

  useEffect(() => {
    check();
  }, [check]);

  return { id: config.id, status, checking, install, recheck: check };
}

/**
 * Batch hook: detects multiple tools at once and returns a map of statuses.
 */
export function useMultiToolDetection(configs: ToolDetectionConfig[]) {
  const results = configs.map((config) => useToolDetection(config));

  const statusMap: Record<string, ToolStatus> = {};
  const checkingMap: Record<string, boolean> = {};
  const installMap: Record<string, () => Promise<void>> = {};

  for (const r of results) {
    statusMap[r.id] = r.status;
    checkingMap[r.id] = r.checking;
    installMap[r.id] = r.install;
  }

  const isAnyChecking = results.some((r) => r.checking);

  return { statusMap, checkingMap, installMap, isAnyChecking, results };
}

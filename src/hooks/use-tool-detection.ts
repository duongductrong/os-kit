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
  /** Shell command to upgrade the tool */
  upgradeCommand?: string;
  /** Shell command to uninstall the tool */
  uninstallCommand?: string;
  /** Shell command to get the version string (stdout is captured and trimmed) */
  versionCommand?: string;
}

export interface ToolDetectionResult {
  id: string;
  status: ToolStatus;
  checking: boolean;
  version: string | null;
  install: () => Promise<void>;
  upgrade: () => Promise<void>;
  uninstall: () => Promise<void>;
  recheck: () => Promise<void>;
  hasUpgrade: boolean;
  hasUninstall: boolean;
}

/** Run a shell command and return the result */
async function execSh(command: string) {
  return Command.create("exec-sh", ["-c", command]).execute();
}

/** Fetch version string from a shell command */
async function fetchVersion(versionCommand: string): Promise<string | null> {
  try {
    const result = await execSh(versionCommand);
    if (result.code === 0 && result.stdout.trim()) {
      return result.stdout.trim();
    }
  } catch {
    // non-critical
  }
  return null;
}

/**
 * Generic hook to detect, get version, install, upgrade, and uninstall a CLI tool.
 */
export function useToolDetection(
  config: ToolDetectionConfig,
): ToolDetectionResult {
  const [status, setStatus] = useState<ToolStatus>("idle");
  const [checking, setChecking] = useState(true);
  const [version, setVersion] = useState<string | null>(null);

  const check = useCallback(async () => {
    setChecking(true);
    try {
      const result = await execSh(config.checkCommand);
      if (result.code === 0) {
        setStatus("installed");
        if (config.versionCommand) {
          setVersion(await fetchVersion(config.versionCommand));
        }
      } else {
        setStatus("idle");
        setVersion(null);
      }
    } catch (error) {
      console.log(`useToolDetection(${config.id}):`, error);
      setStatus("idle");
      setVersion(null);
    } finally {
      setChecking(false);
    }
  }, [config.checkCommand, config.id, config.versionCommand]);

  const install = useCallback(async () => {
    if (!config.installCommand) return;
    setStatus("installing");
    try {
      const result = await execSh(config.installCommand);
      if (result.code === 0) {
        setStatus("installed");
        if (config.versionCommand) {
          setVersion(await fetchVersion(config.versionCommand));
        }
      } else {
        console.error(`Install ${config.id} failed:`, result.stderr);
        setStatus("failed");
      }
    } catch (err) {
      console.error(`Install ${config.id} error:`, err);
      setStatus("failed");
    }
  }, [config.id, config.installCommand, config.versionCommand]);

  const upgrade = useCallback(async () => {
    if (!config.upgradeCommand) return;
    setStatus("installing");
    try {
      const result = await execSh(config.upgradeCommand);
      if (result.code === 0) {
        setStatus("installed");
        if (config.versionCommand) {
          setVersion(await fetchVersion(config.versionCommand));
        }
      } else {
        console.error(`Upgrade ${config.id} failed:`, result.stderr);
        setStatus("installed"); // still installed, just upgrade failed
      }
    } catch (err) {
      console.error(`Upgrade ${config.id} error:`, err);
      setStatus("installed");
    }
  }, [config.id, config.upgradeCommand, config.versionCommand]);

  const uninstall = useCallback(async () => {
    if (!config.uninstallCommand) return;
    setStatus("installing");
    try {
      const result = await execSh(config.uninstallCommand);
      if (result.code === 0) {
        setStatus("idle");
        setVersion(null);
      } else {
        console.error(`Uninstall ${config.id} failed:`, result.stderr);
        setStatus("installed");
      }
    } catch (err) {
      console.error(`Uninstall ${config.id} error:`, err);
      setStatus("installed");
    }
  }, [config.id, config.uninstallCommand]);

  useEffect(() => {
    check();
  }, [check]);

  return {
    id: config.id,
    status,
    checking,
    version,
    install,
    upgrade,
    uninstall,
    recheck: check,
    hasUpgrade: !!config.upgradeCommand,
    hasUninstall: !!config.uninstallCommand,
  };
}

/**
 * Batch hook: detects multiple tools at once and returns maps of statuses, versions, etc.
 */
export function useMultiToolDetection(configs: ToolDetectionConfig[]) {
  const results = configs.map((config) => useToolDetection(config));

  const statusMap: Record<string, ToolStatus> = {};
  const checkingMap: Record<string, boolean> = {};
  const installMap: Record<string, () => Promise<void>> = {};
  const upgradeMap: Record<string, () => Promise<void>> = {};
  const uninstallMap: Record<string, () => Promise<void>> = {};
  const versionMap: Record<string, string | null> = {};
  const capabilityMap: Record<
    string,
    { hasUpgrade: boolean; hasUninstall: boolean }
  > = {};

  for (const r of results) {
    statusMap[r.id] = r.status;
    checkingMap[r.id] = r.checking;
    installMap[r.id] = r.install;
    upgradeMap[r.id] = r.upgrade;
    uninstallMap[r.id] = r.uninstall;
    versionMap[r.id] = r.version;
    capabilityMap[r.id] = {
      hasUpgrade: r.hasUpgrade,
      hasUninstall: r.hasUninstall,
    };
  }

  const isAnyChecking = results.some((r) => r.checking);

  return {
    statusMap,
    checkingMap,
    installMap,
    upgradeMap,
    uninstallMap,
    versionMap,
    capabilityMap,
    isAnyChecking,
    results,
  };
}

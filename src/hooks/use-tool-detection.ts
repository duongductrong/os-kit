import { Command } from "@tauri-apps/plugin-shell";
import { useCallback, useEffect, useState } from "react";
import type { ToolStatus } from "@/lib/types";
import type { ManagedBy } from "@/features/installation/utils/installation-data";

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
  /** Homebrew cask name — if set, detection will check if brew manages this app */
  brewCaskName?: string;
}

/** Callbacks for streaming shell output */
export interface StreamCallbacks {
  onStdout?: (line: string) => void;
  onStderr?: (line: string) => void;
  onStart?: () => void;
  onEnd?: (exitCode: number) => void;
}

export interface ToolDetectionResult {
  id: string;
  status: ToolStatus;
  checking: boolean;
  version: string | null;
  managedBy: ManagedBy;
  install: (stream?: StreamCallbacks) => Promise<void>;
  upgrade: (stream?: StreamCallbacks) => Promise<void>;
  uninstall: (stream?: StreamCallbacks) => Promise<void>;
  recheck: () => Promise<void>;
  hasUpgrade: boolean;
  hasUninstall: boolean;
}

/** Run a shell command and return the result (non-streaming, for checks/versions) */
async function execSh(command: string) {
  return Command.create("exec-sh", ["-c", command]).execute();
}

/** Spawn a shell command with streaming stdout/stderr callbacks. Returns exit code. */
export async function spawnSh(
  command: string,
  callbacks?: StreamCallbacks,
): Promise<number> {
  return new Promise((resolve, reject) => {
    const cmd = Command.create("exec-sh", ["-c", command]);

    cmd.stdout.on("data", (line: string) => {
      callbacks?.onStdout?.(line);
    });

    cmd.stderr.on("data", (line: string) => {
      callbacks?.onStderr?.(line);
    });

    cmd.on("close", (data) => {
      resolve(data.code ?? -1);
    });

    cmd.on("error", (error: string) => {
      reject(new Error(error));
    });

    callbacks?.onStart?.();
    cmd.spawn().catch(reject);
  });
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

/** Check if a cask is managed by Homebrew */
async function checkBrewManaged(caskName: string): Promise<boolean> {
  try {
    const result = await execSh(
      `/opt/homebrew/bin/brew list --cask 2>/dev/null | grep -q "^${caskName}$"`,
    );
    return result.code === 0;
  } catch {
    return false;
  }
}

/**
 * Generic hook to detect, get version, install, upgrade, and uninstall a CLI tool.
 * Install/upgrade/uninstall now support streaming output via optional StreamCallbacks.
 * When brewCaskName is set, also detects whether the app is brew-managed or manually installed.
 */
export function useToolDetection(
  config: ToolDetectionConfig,
): ToolDetectionResult {
  const [status, setStatus] = useState<ToolStatus>("idle");
  const [checking, setChecking] = useState(true);
  const [version, setVersion] = useState<string | null>(null);
  const [managedBy, setManagedBy] = useState<ManagedBy>("manual");

  const check = useCallback(async () => {
    setChecking(true);
    try {
      const result = await execSh(config.checkCommand);
      if (result.code === 0) {
        setStatus("installed");
        if (config.versionCommand) {
          setVersion(await fetchVersion(config.versionCommand));
        }
        // Detect brew management for cask apps
        if (config.brewCaskName) {
          const isBrew = await checkBrewManaged(config.brewCaskName);
          setManagedBy(isBrew ? "brew" : "manual");
        } else {
          // Non-cask tools (CLI tools installed via brew formula, nvm, rustup, etc.)
          // default to "manual" which will use primary commands anyway (no fallbacks defined)
          setManagedBy("manual");
        }
      } else {
        setStatus("idle");
        setVersion(null);
        setManagedBy("manual");
      }
    } catch (error) {
      console.log(`useToolDetection(${config.id}):`, error);
      setStatus("idle");
      setVersion(null);
      setManagedBy("manual");
    } finally {
      setChecking(false);
    }
  }, [
    config.checkCommand,
    config.id,
    config.versionCommand,
    config.brewCaskName,
  ]);

  const install = useCallback(
    async (stream?: StreamCallbacks) => {
      if (!config.installCommand) return;
      setStatus("installing");
      try {
        const exitCode = await spawnSh(config.installCommand, stream);
        if (exitCode === 0) {
          setStatus("installed");
          if (config.versionCommand) {
            setVersion(await fetchVersion(config.versionCommand));
          }
        } else {
          console.error(`Install ${config.id} failed with code ${exitCode}`);
          setStatus("failed");
        }
        stream?.onEnd?.(exitCode);
      } catch (err) {
        console.error(`Install ${config.id} error:`, err);
        setStatus("failed");
        stream?.onEnd?.(-1);
      }
    },
    [config.id, config.installCommand, config.versionCommand],
  );

  const upgrade = useCallback(
    async (stream?: StreamCallbacks) => {
      if (!config.upgradeCommand) return;
      setStatus("installing");
      try {
        const exitCode = await spawnSh(config.upgradeCommand, stream);
        if (exitCode === 0) {
          setStatus("installed");
          if (config.versionCommand) {
            setVersion(await fetchVersion(config.versionCommand));
          }
        } else {
          console.error(`Upgrade ${config.id} failed with code ${exitCode}`);
          setStatus("installed"); // still installed, just upgrade failed
        }
        stream?.onEnd?.(exitCode);
      } catch (err) {
        console.error(`Upgrade ${config.id} error:`, err);
        setStatus("installed");
        stream?.onEnd?.(-1);
      }
    },
    [config.id, config.upgradeCommand, config.versionCommand],
  );

  const uninstall = useCallback(
    async (stream?: StreamCallbacks) => {
      if (!config.uninstallCommand) return;
      setStatus("installing");
      try {
        const exitCode = await spawnSh(config.uninstallCommand, stream);
        if (exitCode === 0) {
          setStatus("idle");
          setVersion(null);
        } else {
          console.error(`Uninstall ${config.id} failed with code ${exitCode}`);
          setStatus("installed");
        }
        stream?.onEnd?.(exitCode);
      } catch (err) {
        console.error(`Uninstall ${config.id} error:`, err);
        setStatus("installed");
        stream?.onEnd?.(-1);
      }
    },
    [config.id, config.uninstallCommand],
  );

  useEffect(() => {
    check();
  }, [check]);

  return {
    id: config.id,
    status,
    checking,
    version,
    managedBy,
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
  const installMap: Record<
    string,
    (stream?: StreamCallbacks) => Promise<void>
  > = {};
  const upgradeMap: Record<
    string,
    (stream?: StreamCallbacks) => Promise<void>
  > = {};
  const uninstallMap: Record<
    string,
    (stream?: StreamCallbacks) => Promise<void>
  > = {};
  const versionMap: Record<string, string | null> = {};
  const managedByMap: Record<string, ManagedBy> = {};
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
    managedByMap[r.id] = r.managedBy;
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
    managedByMap,
    capabilityMap,
    isAnyChecking,
    results,
  };
}

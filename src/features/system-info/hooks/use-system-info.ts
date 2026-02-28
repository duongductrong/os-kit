import { Command } from "@tauri-apps/plugin-shell";
import { useCallback, useEffect, useState } from "react";
import {
  formatBytes,
  parseDfOutput,
  parseGitVersion,
  type SystemInfo,
} from "../utils/parse-system-commands";

async function runSh(cmd: string): Promise<string> {
  const r = await Command.create("exec-sh", ["-c", cmd]).execute();
  if (r.code !== 0) throw new Error(r.stderr || `Command failed: ${cmd}`);
  return r.stdout.trim();
}

async function tryRun(cmd: string): Promise<string | null> {
  try {
    return await runSh(cmd);
  } catch {
    return null;
  }
}

export function useSystemInfo() {
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [
        osVersion,
        osBuild,
        arch,
        cpuName,
        cpuCores,
        memBytes,
        dfOutput,
        xcodeCliPath,
        shellName,
        brewVersion,
        brewCount,
        nodeVersion,
        gitVersionRaw,
      ] = await Promise.all([
        tryRun("sw_vers -productVersion"),
        tryRun("sw_vers -buildVersion"),
        tryRun("uname -m"),
        tryRun("sysctl -n machdep.cpu.brand_string"),
        tryRun("sysctl -n hw.ncpu"),
        tryRun("sysctl -n hw.memsize"),
        tryRun("df -h /"),
        tryRun("xcode-select -p 2>/dev/null"),
        tryRun("echo $SHELL"),
        tryRun("/opt/homebrew/bin/brew --version 2>/dev/null | head -1"),
        tryRun("/opt/homebrew/bin/brew list 2>/dev/null | wc -l"),
        tryRun("node -v 2>/dev/null"),
        tryRun("git --version 2>/dev/null"),
      ]);

      const disk = dfOutput ? parseDfOutput(dfOutput) : null;

      // Get shell version
      let shellVersion: string | null = null;
      if (shellName) {
        shellVersion = await tryRun(`${shellName} --version 2>&1 | head -1`);
      }

      setInfo({
        osVersion,
        osBuild,
        arch,
        cpuName,
        cpuCores,
        memoryTotal: memBytes ? formatBytes(parseInt(memBytes, 10)) : null,
        diskTotal: disk?.total ?? null,
        diskUsed: disk?.used ?? null,
        diskAvailable: disk?.available ?? null,
        xcodeCliPath,
        xcodeCliInstalled: !!xcodeCliPath,
        shellName,
        shellVersion,
        brewVersion: brewVersion?.replace("Homebrew ", "") ?? null,
        brewPackageCount: brewCount?.trim() ?? null,
        nodeVersion,
        gitVersion: gitVersionRaw ? parseGitVersion(gitVersionRaw) : null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load system info");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const installXcodeCli = useCallback(async () => {
    try {
      await Command.create("exec-sh", ["-c", "xcode-select --install"]).execute();
    } catch (err) {
      console.error("Failed to trigger Xcode CLI install:", err);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { info, isLoading, error, refresh, installXcodeCli };
}

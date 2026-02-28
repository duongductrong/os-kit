import { Command } from "@tauri-apps/plugin-shell";
import { useCallback, useEffect, useState } from "react";

export interface OutdatedPackage {
  name: string;
  currentVersion: string;
  latestVersion: string;
  pinned: boolean;
}

export interface HomebrewHealthState {
  // Doctor
  doctorWarnings: string[];
  isDoctorRunning: boolean;
  // Outdated
  outdatedPackages: OutdatedPackage[];
  isOutdatedLoading: boolean;
  // Cleanup
  reclaimableSize: string | null;
  isCleanupRunning: boolean;
  // Actions
  runDoctor: () => Promise<void>;
  checkOutdated: () => Promise<void>;
  runCleanup: () => Promise<void>;
  upgradeAll: () => Promise<void>;
  upgradeSingle: (name: string) => Promise<void>;
  // General
  isLoading: boolean;
  error: string | null;
}

async function execSh(command: string) {
  return Command.create("exec-sh", ["-c", command]).execute();
}

export function useHomebrewHealth(): HomebrewHealthState {
  const [doctorWarnings, setDoctorWarnings] = useState<string[]>([]);
  const [isDoctorRunning, setIsDoctorRunning] = useState(false);
  const [outdatedPackages, setOutdatedPackages] = useState<OutdatedPackage[]>([]);
  const [isOutdatedLoading, setIsOutdatedLoading] = useState(false);
  const [reclaimableSize, setReclaimableSize] = useState<string | null>(null);
  const [isCleanupRunning, setIsCleanupRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDoctor = useCallback(async () => {
    setIsDoctorRunning(true);
    setError(null);
    try {
      const result = await execSh("/opt/homebrew/bin/brew doctor 2>&1");
      const output = result.stdout.trim();
      if (output === "Your system is ready to brew.") {
        setDoctorWarnings([]);
      } else {
        // Split by "Warning:" prefix to get individual warnings
        const warnings = output
          .split(/^Warning:/m)
          .map((w) => w.trim())
          .filter(Boolean);
        setDoctorWarnings(warnings);
      }
    } catch (err) {
      setError("Failed to run brew doctor");
      console.error("brew doctor error:", err);
    } finally {
      setIsDoctorRunning(false);
    }
  }, []);

  const checkOutdated = useCallback(async () => {
    setIsOutdatedLoading(true);
    setError(null);
    try {
      const result = await execSh(
        "/opt/homebrew/bin/brew outdated --json=v2 2>/dev/null",
      );
      if (result.code === 0 && result.stdout.trim()) {
        const json = JSON.parse(result.stdout);
        const formulae = (json.formulae ?? []).map(
          (f: { name: string; installed_versions: string[]; current_version: string; pinned: boolean }) => ({
            name: f.name,
            currentVersion: f.installed_versions?.[0] ?? "unknown",
            latestVersion: f.current_version,
            pinned: f.pinned ?? false,
          }),
        );
        const casks = (json.casks ?? []).map(
          (c: { name: string; installed_versions: string; current_version: string }) => ({
            name: c.name,
            currentVersion: c.installed_versions ?? "unknown",
            latestVersion: c.current_version,
            pinned: false,
          }),
        );
        setOutdatedPackages([...formulae, ...casks]);
      } else {
        setOutdatedPackages([]);
      }
    } catch (err) {
      setError("Failed to check outdated packages");
      console.error("brew outdated error:", err);
    } finally {
      setIsOutdatedLoading(false);
    }
  }, []);

  const checkCleanupSize = useCallback(async () => {
    try {
      const result = await execSh(
        "/opt/homebrew/bin/brew cleanup --dry-run 2>&1 | tail -1",
      );
      if (result.code === 0 && result.stdout.trim()) {
        const match = result.stdout.match(
          /(\d+(?:\.\d+)?\s*(?:KB|MB|GB|B|bytes))/i,
        );
        setReclaimableSize(match ? match[1] : null);
      }
    } catch {
      // non-critical
    }
  }, []);

  const runCleanup = useCallback(async () => {
    setIsCleanupRunning(true);
    try {
      await execSh("/opt/homebrew/bin/brew cleanup");
      setReclaimableSize(null);
      await checkCleanupSize();
    } catch (err) {
      setError("Failed to run cleanup");
      console.error("brew cleanup error:", err);
    } finally {
      setIsCleanupRunning(false);
    }
  }, [checkCleanupSize]);

  const upgradeAll = useCallback(async () => {
    try {
      await execSh("/opt/homebrew/bin/brew upgrade");
      await checkOutdated();
    } catch (err) {
      setError("Failed to upgrade all packages");
      console.error("brew upgrade error:", err);
    }
  }, [checkOutdated]);

  const upgradeSingle = useCallback(
    async (name: string) => {
      try {
        await execSh(`/opt/homebrew/bin/brew upgrade ${name}`);
        await checkOutdated();
      } catch (err) {
        setError(`Failed to upgrade ${name}`);
        console.error(`brew upgrade ${name} error:`, err);
      }
    },
    [checkOutdated],
  );

  // Initial load
  useEffect(() => {
    checkOutdated();
    checkCleanupSize();
  }, [checkOutdated, checkCleanupSize]);

  const isLoading = isDoctorRunning || isOutdatedLoading;

  return {
    doctorWarnings,
    isDoctorRunning,
    outdatedPackages,
    isOutdatedLoading,
    reclaimableSize,
    isCleanupRunning,
    runDoctor,
    checkOutdated,
    runCleanup,
    upgradeAll,
    upgradeSingle,
    isLoading,
    error,
  };
}

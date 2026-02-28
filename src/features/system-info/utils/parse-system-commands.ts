export interface SystemInfo {
  // macOS
  osVersion: string | null;
  osBuild: string | null;
  arch: string | null;

  // CPU
  cpuName: string | null;
  cpuCores: string | null;

  // Memory
  memoryTotal: string | null;

  // Disk
  diskTotal: string | null;
  diskUsed: string | null;
  diskAvailable: string | null;

  // Dev tools
  xcodeCliPath: string | null;
  xcodeCliInstalled: boolean;
  shellName: string | null;
  shellVersion: string | null;
  brewVersion: string | null;
  brewPackageCount: string | null;
  nodeVersion: string | null;
  gitVersion: string | null;
}

/** Format bytes (from hw.memsize) to human-readable GB */
export function formatBytes(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  return `${gb.toFixed(1)} GB`;
}

/** Parse `df -h /` output to extract disk info */
export function parseDfOutput(output: string): {
  total: string;
  used: string;
  available: string;
} {
  const lines = output.trim().split("\n");
  if (lines.length < 2) return { total: "N/A", used: "N/A", available: "N/A" };

  const parts = lines[1].split(/\s+/);
  // df -h /: Filesystem Size Used Avail Capacity ...
  return {
    total: parts[1] || "N/A",
    used: parts[2] || "N/A",
    available: parts[3] || "N/A",
  };
}

/** Extract version from git --version output (e.g. "git version 2.39.3") */
export function parseGitVersion(output: string): string {
  return output.replace("git version ", "").trim();
}

/** Extract brew package count from `brew list | wc -l` */
export function parseBrewCount(output: string): string {
  return output.trim();
}

import { Command } from "@tauri-apps/plugin-shell";
import { useCallback, useEffect, useState } from "react";

export interface NvmVersion {
  version: string;
  isCurrent: boolean;
}

/**
 * Hook to list all Node.js versions installed via nvm.
 */
export function useNvmVersions() {
  const [versions, setVersions] = useState<NvmVersion[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    try {
      const result = await Command.create("exec-sh", [
        "-c",
        ". $HOME/.nvm/nvm.sh && nvm ls --no-colors 2>/dev/null",
      ]).execute();

      if (result.code === 0) {
        const parsed = parseNvmList(result.stdout);
        setVersions(parsed);
      }
    } catch (err) {
      console.log("useNvmVersions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  return { versions, loading, refresh: fetchVersions };
}

/**
 * Parse `nvm ls --no-colors` output into version objects.
 * Lines look like: "->     v22.1.0 *" or "       v18.17.0 *"
 */
function parseNvmList(output: string): NvmVersion[] {
  const lines = output.split("\n");
  const versions: NvmVersion[] = [];

  for (const line of lines) {
    // Match lines containing a version like v18.17.0
    const match = line.match(/(->)?\s+(v\d+\.\d+\.\d+)/);
    if (match) {
      versions.push({
        version: match[2],
        isCurrent: match[1] === "->",
      });
    }
  }

  return versions;
}

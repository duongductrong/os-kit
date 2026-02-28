import { Command } from "@tauri-apps/plugin-shell";
import { useEffect, useState } from "react";

/**
 * Lightweight hook that returns the count of outdated Homebrew packages.
 * Runs once on mount and caches the result. Used by sidebar for badge display.
 */
export function useOutdatedCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const result = await Command.create("exec-sh", [
          "-c",
          "/opt/homebrew/bin/brew outdated --json=v2 2>/dev/null",
        ]).execute();

        if (cancelled || result.code !== 0 || !result.stdout.trim()) return;

        const json = JSON.parse(result.stdout);
        const total =
          (json.formulae?.length ?? 0) + (json.casks?.length ?? 0);
        setCount(total);
      } catch {
        // Homebrew not installed or other error — no badge
      }
    }

    check();
    return () => { cancelled = true; };
  }, []);

  return count;
}

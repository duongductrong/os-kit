import { Command } from "@tauri-apps/plugin-shell";
import { useCallback, useEffect, useState } from "react";
import type { ToolStatus } from "@/lib/types";

/**
 * Hook to check Homebrew installation status and install it if needed.
 * Uses Tauri's shell plugin to test known Homebrew install paths.
 */
export function useHomebrew() {
  const [status, setStatus] = useState<ToolStatus>("idle");
  const [checking, setChecking] = useState(true);

  /** Check if Homebrew is installed by testing known install paths */
  const checkHomebrew = useCallback(async () => {
    setChecking(true);
    try {
      // Tauri's shell doesn't inherit the user's full PATH,
      // so we check the known Homebrew install locations directly.
      const result = await Command.create("exec-sh", [
        "-c",
        "test -x /opt/homebrew/bin/brew || test -x /usr/local/bin/brew",
      ]).execute();

      if (result.code === 0) {
        setStatus("installed");
      } else {
        setStatus("idle");
      }
    } catch (error) {
      console.log("useHomebrew: ", error);
      // Shell command failed — Homebrew not found
      setStatus("idle");
    } finally {
      setChecking(false);
    }
  }, []);

  /** Install Homebrew using the official install script */
  const installHomebrew = useCallback(async () => {
    setStatus("installing");
    try {
      const result = await Command.create("exec-sh", [
        "-c",
        '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"',
      ]).execute();

      if (result.code === 0) {
        setStatus("installed");
      } else {
        console.error("Homebrew install failed:", result.stderr);
        setStatus("failed");
      }
    } catch (err) {
      console.error("Homebrew install error:", err);
      setStatus("failed");
    }
  }, []);

  // Auto-check on mount
  useEffect(() => {
    checkHomebrew();
  }, [checkHomebrew]);

  return {
    status,
    checking,
    installHomebrew,
    recheckHomebrew: checkHomebrew,
  };
}

import { Command } from "@tauri-apps/plugin-shell";
import { useCallback, useState } from "react";
import { generateNginxHttpConfig, generateNginxConfig, getNginxConfigPath } from "../utils/proxy-templates";
import { getCertDir, getCertPath, getKeyPath } from "../utils/cert-paths";

async function runSh(cmd: string): Promise<string> {
  const output = await Command.create("exec-sh", ["-c", cmd]).execute();
  if (output.code !== 0) {
    throw new Error(output.stderr || `Command failed with code ${output.code}`);
  }
  return output.stdout;
}

/** Check if an nginx config file exists for the given domain */
export async function checkNginxConfig(domain: string): Promise<boolean> {
  const confPath = getNginxConfigPath(domain);
  try {
    await runSh(`test -f "${confPath}"`);
    return true;
  } catch {
    return false;
  }
}

export function useNginxProxy() {
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Write nginx config and reload. Uses sudo for port 80. */
  const applyProxy = useCallback(async (domain: string, port: number, useSsl: boolean) => {
    setIsApplying(true);
    setError(null);
    try {
      const confPath = getNginxConfigPath(domain);

      let config: string;
      if (useSsl) {
        const certDir = await getCertDir(domain);
        config = generateNginxConfig({
          domain,
          port,
          certPath: getCertPath(certDir),
          keyPath: getKeyPath(certDir),
        });
      } else {
        config = generateNginxHttpConfig({ domain, port });
      }

      // Ensure servers directory exists
      await runSh("mkdir -p /opt/homebrew/etc/nginx/servers");

      // Write config + reload nginx with sudo (port 80 requires root)
      const encoder = new TextEncoder();
      const bytes = encoder.encode(config);
      const base64 = btoa(String.fromCharCode(...bytes));

      const writeCmd = `echo '${base64}' | base64 -d > '${confPath}'`;
      const reloadCmd = "nginx -s reload 2>/dev/null || nginx";
      const script = `do shell script "${writeCmd} && ${reloadCmd}" with administrator privileges`;
      await runSh(`osascript -e '${script}'`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to apply proxy";
      setError(msg);
      throw err;
    } finally {
      setIsApplying(false);
    }
  }, []);

  /** Remove nginx config and reload */
  const removeProxy = useCallback(async (domain: string) => {
    setIsApplying(true);
    setError(null);
    try {
      const confPath = getNginxConfigPath(domain);
      const removeCmd = `rm -f '${confPath}'`;
      const reloadCmd = "nginx -s reload 2>/dev/null || true";
      const script = `do shell script "${removeCmd} && ${reloadCmd}" with administrator privileges`;
      await runSh(`osascript -e '${script}'`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to remove proxy";
      setError(msg);
      throw err;
    } finally {
      setIsApplying(false);
    }
  }, []);

  return { applyProxy, removeProxy, isApplying, error, setError };
}

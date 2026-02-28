import { Command } from "@tauri-apps/plugin-shell";
import { useCallback, useEffect, useRef, useState } from "react";

async function runSh(cmd: string): Promise<string> {
  const output = await Command.create("exec-sh", ["-c", cmd]).execute();
  if (output.code !== 0) {
    throw new Error(output.stderr || `Command failed with code ${output.code}`);
  }
  return output.stdout;
}

export interface ProxyInfo {
  installed: boolean;
  running: boolean;
  path: string | null;
}

export interface ProxyStatus {
  caddy: ProxyInfo;
  nginx: ProxyInfo;
  isChecking: boolean;
}

const EMPTY_PROXY: ProxyInfo = { installed: false, running: false, path: null };

async function detectProxy(name: "caddy" | "nginx"): Promise<ProxyInfo> {
  const whichResult = await runSh(`which ${name} 2>/dev/null`).catch(() => "");
  const installed = whichResult.trim().length > 0;
  if (!installed) return EMPTY_PROXY;

  const running = await runSh(`pgrep -x ${name} 2>/dev/null`)
    .then((out) => out.trim().length > 0)
    .catch(() => false);

  return { installed, running, path: whichResult.trim() };
}

export function useProxyDetection() {
  const [status, setStatus] = useState<ProxyStatus>({
    caddy: EMPTY_PROXY,
    nginx: EMPTY_PROXY,
    isChecking: true,
  });
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    setStatus((s) => ({ ...s, isChecking: true }));
    try {
      const [caddy, nginx] = await Promise.all([
        detectProxy("caddy"),
        detectProxy("nginx"),
      ]);
      if (mountedRef.current) {
        setStatus({ caddy, nginx, isChecking: false });
      }
    } catch {
      if (mountedRef.current) {
        setStatus((s) => ({ ...s, isChecking: false }));
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    refresh();
    return () => { mountedRef.current = false; };
  }, [refresh]);

  return { ...status, refresh };
}

import { Command } from "@tauri-apps/plugin-shell";
import { useCallback, useEffect, useRef, useState } from "react";
import { getCertDir, getCertPath } from "../utils/cert-paths";

async function runSh(cmd: string): Promise<string> {
  const output = await Command.create("exec-sh", ["-c", cmd]).execute();
  if (output.code !== 0) {
    throw new Error(output.stderr || `Command failed with code ${output.code}`);
  }
  return output.stdout;
}

export interface MkcertState {
  isInstalled: boolean;
  isCAInstalled: boolean;
  caRootPath: string | null;
  isChecking: boolean;
  error: string | null;
}

export function useMkcert() {
  const [state, setState] = useState<MkcertState>({
    isInstalled: false,
    isCAInstalled: false,
    caRootPath: null,
    isChecking: true,
    error: null,
  });
  const mountedRef = useRef(true);

  const checkInstallation = useCallback(async () => {
    setState((s) => ({ ...s, isChecking: true, error: null }));
    try {
      const whichResult = await runSh("which mkcert 2>/dev/null").catch(() => "");
      const isInstalled = whichResult.trim().length > 0;

      let caRootPath: string | null = null;
      let isCAInstalled = false;
      if (isInstalled) {
        caRootPath = (await runSh("mkcert -CAROOT 2>/dev/null").catch(() => "")).trim() || null;
        if (caRootPath) {
          const exists = await runSh(`test -d "${caRootPath}" && echo "yes"`).catch(() => "");
          isCAInstalled = exists.trim() === "yes";
        }
      }

      if (mountedRef.current) {
        setState({ isInstalled, isCAInstalled, caRootPath, isChecking: false, error: null });
      }
    } catch (err) {
      if (mountedRef.current) {
        setState((s) => ({
          ...s,
          isChecking: false,
          error: err instanceof Error ? err.message : "Failed to check mkcert",
        }));
      }
    }
  }, []);

  const installCA = useCallback(async () => {
    setState((s) => ({ ...s, error: null }));
    try {
      await runSh("mkcert -install");
      await checkInstallation();
    } catch (err) {
      if (mountedRef.current) {
        setState((s) => ({
          ...s,
          error: err instanceof Error ? err.message : "Failed to install CA",
        }));
      }
    }
  }, [checkInstallation]);

  const generateCert = useCallback(async (domain: string) => {
    const certDir = await getCertDir(domain);
    await runSh(`mkdir -p "${certDir}"`);
    const certPath = getCertPath(certDir);
    const keyPath = `${certDir}/key.pem`;
    await runSh(
      `mkcert -cert-file "${certPath}" -key-file "${keyPath}" "${domain}" localhost 127.0.0.1`,
    );
    return { certPath, keyPath };
  }, []);

  const checkExpiry = useCallback(async (certPath: string): Promise<string | null> => {
    try {
      const out = await runSh(`openssl x509 -enddate -noout -in "${certPath}"`);
      const match = out.match(/notAfter=(.+)/);
      return match ? new Date(match[1]).toISOString() : null;
    } catch {
      return null;
    }
  }, []);

  const deleteCert = useCallback(async (domain: string) => {
    const certDir = await getCertDir(domain);
    await runSh(`rm -rf "${certDir}"`);
  }, []);

  const getCertStatus = useCallback(
    async (domain: string): Promise<{ exists: boolean; expiry: string | null }> => {
      try {
        const certDir = await getCertDir(domain);
        const certPath = getCertPath(certDir);
        await runSh(`test -f "${certPath}"`);
        const expiry = await checkExpiry(certPath);
        return { exists: true, expiry };
      } catch {
        return { exists: false, expiry: null };
      }
    },
    [checkExpiry],
  );

  useEffect(() => {
    mountedRef.current = true;
    checkInstallation();
    return () => { mountedRef.current = false; };
  }, [checkInstallation]);

  return {
    ...state,
    checkInstallation,
    installCA,
    generateCert,
    checkExpiry,
    deleteCert,
    getCertStatus,
  };
}

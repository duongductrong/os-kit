import { Command } from "@tauri-apps/plugin-shell";
import { useCallback, useEffect, useRef, useState } from "react";
import { sanitizeDomain, getDomainError } from "../utils/validate-domain";
import { getCertDir, getCertPath } from "../utils/cert-paths";
import { checkNginxConfig } from "./use-nginx-proxy";

async function runSh(cmd: string): Promise<string> {
  const output = await Command.create("exec-sh", ["-c", cmd]).execute();
  if (output.code !== 0) {
    throw new Error(output.stderr || `Command failed with code ${output.code}`);
  }
  return output.stdout;
}

const OSKIT_MARKER = "oskit-managed";

export interface LocalDomain {
  domain: string;
  port: number;
  hostsEnabled: boolean;
  certExists: boolean;
  certExpiry: string | null;
  proxyEnabled: boolean;
}

/** Read /etc/hosts fresh from disk every time — never rely on stale React state */
async function readHostsFromDisk(): Promise<string> {
  return await runSh("cat /etc/hosts");
}

/** Write /etc/hosts with sudo elevation + flush DNS in one auth prompt */
async function writeHostsAndFlush(content: string): Promise<void> {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(content);
  const base64 = btoa(String.fromCharCode(...bytes));

  // Backup before write
  await runSh("cp /etc/hosts /etc/hosts.oskit-backup 2>/dev/null || true").catch(() => {});

  // Write hosts + flush DNS in a single osascript call (one auth prompt)
  const script = `do shell script "echo '${base64}' | base64 -d > /etc/hosts && dscacheutil -flushcache && killall -HUP mDNSResponder" with administrator privileges`;
  await runSh(`osascript -e '${script}'`);
}

/** Parse oskit-managed entries from raw hosts content */
function parseManagedEntries(content: string) {
  const results: Array<{ domain: string; port: number; enabled: boolean; lineIndex: number }> = [];
  content.split("\n").forEach((line, lineIndex) => {
    if (!line.includes(OSKIT_MARKER)) return;
    const trimmed = line.trim();
    const isCommented = trimmed.startsWith("#");
    const effectiveLine = isCommented ? trimmed.slice(1).trim() : trimmed;

    // Extract hostname and port from: 127.0.0.1  domain.local  # oskit-managed:3000
    const commentIdx = effectiveLine.indexOf("#");
    if (commentIdx < 0) return;
    const beforeComment = effectiveLine.slice(0, commentIdx).trim();
    const comment = effectiveLine.slice(commentIdx + 1).trim();

    const parts = beforeComment.split(/\s+/).filter(Boolean);
    if (parts.length < 2) return;

    const portMatch = comment.match(/oskit-managed:(\d+)/);
    results.push({
      domain: parts[1],
      port: portMatch ? parseInt(portMatch[1], 10) : 0,
      enabled: !isCommented,
      lineIndex,
    });
  });
  return results;
}

export function useLocalDomains() {
  const [domains, setDomains] = useState<LocalDomain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [domainError, setDomainError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  /** Refresh domain list from disk + scan cert statuses */
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const content = await readHostsFromDisk();
      const managed = parseManagedEntries(content);

      // Scan cert statuses for each managed domain
      const enriched: LocalDomain[] = [];
      for (const entry of managed) {
        let certExists = false;
        let certExpiry: string | null = null;
        try {
          const certDir = await getCertDir(entry.domain);
          const certPath = getCertPath(certDir);
          await runSh(`test -f "${certPath}"`);
          certExists = true;
          const out = await runSh(
            `openssl x509 -enddate -noout -in "${certPath}"`,
          ).catch(() => "");
          const match = out.match(/notAfter=(.+)/);
          if (match) certExpiry = new Date(match[1]).toISOString();
        } catch { /* cert doesn't exist */ }

        const proxyEnabled = await checkNginxConfig(entry.domain);

        enriched.push({
          domain: entry.domain,
          port: entry.port,
          hostsEnabled: entry.enabled,
          certExists,
          certExpiry,
          proxyEnabled,
        });
      }

      if (mountedRef.current) setDomains(enriched);
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to read /etc/hosts");
      }
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    refresh();
    return () => { mountedRef.current = false; };
  }, [refresh]);

  const addDomain = useCallback(
    async (domain: string, port: number) => {
      const clean = sanitizeDomain(domain);
      const validationError = getDomainError(clean);
      if (validationError) {
        setDomainError(validationError);
        return;
      }
      setDomainError(null);
      setIsProcessing(true);

      try {
        // Always read fresh from disk before mutating
        const content = await readHostsFromDisk();
        const managed = parseManagedEntries(content);

        if (managed.some((e) => e.domain === clean)) {
          setDomainError("Domain already managed by OSKit");
          return;
        }

        // Check for non-oskit conflicts
        const lines = content.split("\n");
        const hasConflict = lines.some((line) => {
          const trimmed = line.trim();
          if (trimmed.startsWith("#") || !trimmed) return false;
          if (trimmed.includes(OSKIT_MARKER)) return false;
          return trimmed.split(/\s+/).includes(clean);
        });
        if (hasConflict) {
          setDomainError("Domain already exists in /etc/hosts (not managed by OSKit)");
          return;
        }

        // Append new entry to end of file
        const newLine = `127.0.0.1\t${clean}\t# ${OSKIT_MARKER}:${port}`;
        const newContent = content.trimEnd() + "\n" + newLine + "\n";
        await writeHostsAndFlush(newContent);
        await refresh();
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : "Failed to add domain");
        }
      } finally {
        if (mountedRef.current) setIsProcessing(false);
      }
    },
    [refresh],
  );

  const removeDomain = useCallback(
    async (domain: string) => {
      setIsProcessing(true);
      try {
        // Always read fresh from disk before mutating
        const content = await readHostsFromDisk();
        const lines = content.split("\n");

        // Remove only oskit-managed lines matching this domain
        const filtered = lines.filter((line) => {
          if (!line.includes(OSKIT_MARKER)) return true;
          const trimmed = line.trim();
          const effective = trimmed.startsWith("#") ? trimmed.slice(1).trim() : trimmed;
          const parts = effective.split(/\s+/).filter(Boolean);
          return parts.length < 2 || parts[1] !== domain;
        });

        await writeHostsAndFlush(filtered.join("\n"));
        await refresh();
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : "Failed to remove domain");
        }
      } finally {
        if (mountedRef.current) setIsProcessing(false);
      }
    },
    [refresh],
  );

  return {
    domains,
    isLoading,
    isSaving: isProcessing,
    isProcessing,
    error,
    domainError,
    setDomainError,
    addDomain,
    removeDomain,
    refresh,
  };
}

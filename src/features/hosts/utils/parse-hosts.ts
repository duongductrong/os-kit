export interface HostsEntry {
  ip: string;
  hostname: string;
  comment: string;
  enabled: boolean;
  /** True for system entries like localhost, broadcasthost */
  isSystem: boolean;
  /** Original line index for stable identity */
  lineIndex: number;
}

const SYSTEM_HOSTNAMES = new Set([
  "localhost",
  "broadcasthost",
  "ip6-localhost",
  "ip6-loopback",
  "ip6-localnet",
  "ip6-mcastprefix",
  "ip6-allnodes",
  "ip6-allrouters",
]);

/** Parse /etc/hosts into structured entries */
export function parseHosts(content: string): HostsEntry[] {
  const entries: HostsEntry[] = [];

  content.split("\n").forEach((line, lineIndex) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Check if line is commented out
    const isCommented = trimmed.startsWith("#");
    const effectiveLine = isCommented ? trimmed.slice(1).trim() : trimmed;

    // Try to parse as hosts entry: IP hostname [# comment]
    const commentIdx = effectiveLine.indexOf("#");
    const beforeComment = commentIdx >= 0 ? effectiveLine.slice(0, commentIdx).trim() : effectiveLine;
    const comment = commentIdx >= 0 ? effectiveLine.slice(commentIdx + 1).trim() : "";

    const parts = beforeComment.split(/\s+/).filter(Boolean);
    if (parts.length < 2) return; // Not a valid hosts entry

    const ip = parts[0];
    // Validate IP-like pattern (basic check)
    if (!/^[\d.:a-fA-F]+$/.test(ip) && ip !== "::1" && !ip.startsWith("fe")) return;

    const hostname = parts[1];
    const isSystem = SYSTEM_HOSTNAMES.has(hostname.toLowerCase());

    entries.push({
      ip,
      hostname,
      comment,
      enabled: !isCommented,
      isSystem,
      lineIndex,
    });
  });

  return entries;
}

/** Rebuild /etc/hosts content from entries, preserving non-entry lines */
export function buildHosts(
  originalContent: string,
  entries: HostsEntry[],
): string {
  const lines = originalContent.split("\n");
  const entryByLine = new Map<number, HostsEntry>();
  for (const entry of entries) {
    entryByLine.set(entry.lineIndex, entry);
  }

  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const entry = entryByLine.get(i);
    if (entry) {
      const base = `${entry.ip}\t${entry.hostname}${entry.comment ? `\t# ${entry.comment}` : ""}`;
      result.push(entry.enabled ? base : `# ${base}`);
      entryByLine.delete(i);
    } else {
      result.push(lines[i]);
    }
  }

  // Append new entries (lineIndex beyond original content length)
  for (const entry of entryByLine.values()) {
    const base = `${entry.ip}\t${entry.hostname}${entry.comment ? `\t# ${entry.comment}` : ""}`;
    result.push(entry.enabled ? base : `# ${base}`);
  }

  return result.join("\n");
}

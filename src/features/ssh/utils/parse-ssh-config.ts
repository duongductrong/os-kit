export interface SshKey {
  filename: string;
  type: string;
  fingerprint: string;
  comment: string;
  publicKey: string;
}

export interface SshHostBlock {
  host: string;
  hostname?: string;
  user?: string;
  port?: string;
  identityFile?: string;
  proxyJump?: string;
  /** Any other key-value pairs */
  extras: { key: string; value: string }[];
}

/** Parse ~/.ssh/config into Host blocks */
export function parseSshConfig(content: string): SshHostBlock[] {
  const blocks: SshHostBlock[] = [];
  let current: SshHostBlock | null = null;

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const matchHost = trimmed.match(/^Host\s+(.+)$/i);
    if (matchHost) {
      current = {
        host: matchHost[1].trim(),
        extras: [],
      };
      blocks.push(current);
      continue;
    }

    if (current) {
      const spaceIdx = trimmed.indexOf(" ");
      if (spaceIdx > 0) {
        const key = trimmed.slice(0, spaceIdx).trim();
        const value = trimmed.slice(spaceIdx + 1).trim();
        const keyLower = key.toLowerCase();

        if (keyLower === "hostname") current.hostname = value;
        else if (keyLower === "user") current.user = value;
        else if (keyLower === "port") current.port = value;
        else if (keyLower === "identityfile") current.identityFile = value;
        else if (keyLower === "proxyjump") current.proxyJump = value;
        else current.extras.push({ key, value });
      }
    }
  }

  return blocks;
}

/** Rebuild SSH config content from host blocks */
export function buildSshConfig(blocks: SshHostBlock[]): string {
  return blocks
    .map((b) => {
      const lines = [`Host ${b.host}`];
      if (b.hostname) lines.push(`  HostName ${b.hostname}`);
      if (b.user) lines.push(`  User ${b.user}`);
      if (b.port) lines.push(`  Port ${b.port}`);
      if (b.identityFile) lines.push(`  IdentityFile ${b.identityFile}`);
      if (b.proxyJump) lines.push(`  ProxyJump ${b.proxyJump}`);
      for (const e of b.extras) {
        lines.push(`  ${e.key} ${e.value}`);
      }
      return lines.join("\n");
    })
    .join("\n\n");
}

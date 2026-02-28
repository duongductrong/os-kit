export interface PortEntry {
  pid: number;
  process: string;
  user: string;
  port: number;
  address: string;
}

/** Parse lsof -i -P -n -sTCP:LISTEN output into typed entries */
export function parseLsof(output: string): PortEntry[] {
  const lines = output.trim().split("\n");
  if (lines.length < 2) return [];

  const entries: PortEntry[] = [];
  const seen = new Set<string>();

  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(/\s+/);
    if (parts.length < 9) continue;

    const process = parts[0];
    const pid = parseInt(parts[1], 10);
    const user = parts[2];
    const name = parts[parts.length - 1]; // e.g. *:3000 or 127.0.0.1:8080

    const portMatch = name.match(/:(\d+)$/);
    if (!portMatch) continue;

    const port = parseInt(portMatch[1], 10);
    const address = name.replace(`:${port}`, "") || "*";

    // Dedupe by pid+port
    const key = `${pid}:${port}`;
    if (seen.has(key)) continue;
    seen.add(key);

    entries.push({ pid, process, user, port, address });
  }

  return entries.sort((a, b) => a.port - b.port);
}

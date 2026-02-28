/**
 * Parses ~/.zshrc content into structured sections for visual editing.
 * Handles: environment variables, aliases, PATH entries, source/plugin statements.
 * Lines that don't match any category go into "other" to preserve them on rebuild.
 */

export interface ZshrcEnvVar {
  id: string;
  name: string;
  value: string;
  /** Original raw line for faithful reconstruction */
  raw: string;
}

export interface ZshrcAlias {
  id: string;
  name: string;
  command: string;
  raw: string;
}

export interface ZshrcPathEntry {
  id: string;
  path: string;
  raw: string;
}

export interface ZshrcSource {
  id: string;
  path: string;
  raw: string;
}

export interface ZshrcParsed {
  envVars: ZshrcEnvVar[];
  aliases: ZshrcAlias[];
  pathEntries: ZshrcPathEntry[];
  sources: ZshrcSource[];
  /** Lines that don't match any known pattern — preserved as-is */
  otherLines: string[];
}

let idCounter = 0;
function nextId(): string {
  return `zshrc-${++idCounter}-${Date.now()}`;
}

// ── regex patterns ──────────────────────────────────────────────
// export VAR=value  or  export VAR="value"  or  export VAR='value'
const RE_EXPORT = /^export\s+([A-Za-z_][A-Za-z0-9_]*)=(.*)$/;
// PATH-specific: export PATH="...:$PATH"  or  export PATH=...:$PATH
const RE_PATH_EXPORT = /^export\s+PATH=(.+)$/;
// alias name='command' or alias name="command" or alias name=command
const RE_ALIAS = /^alias\s+([A-Za-z_][A-Za-z0-9_-]*)=(.*)$/;
// source ... or . ...
const RE_SOURCE = /^(?:source|\.)\s+(.+)$/;

function unquote(s: string): string {
  const trimmed = s.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export function parseZshrc(content: string): ZshrcParsed {
  const result: ZshrcParsed = {
    envVars: [],
    aliases: [],
    pathEntries: [],
    sources: [],
    otherLines: [],
  };

  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comments — keep them in otherLines for reconstruction
    if (trimmed === "" || trimmed.startsWith("#")) {
      result.otherLines.push(line);
      continue;
    }

    // Check PATH export first (before generic export)
    const pathMatch = trimmed.match(RE_PATH_EXPORT);
    if (pathMatch && trimmed.includes("PATH")) {
      // Strip outer quotes from the whole value first, then split
      let rawValue = pathMatch[1].trim();
      // Remove wrapping quotes (handles "..." and '...')
      if (
        (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
        (rawValue.startsWith("'") && rawValue.endsWith("'"))
      ) {
        rawValue = rawValue.slice(1, -1);
      }
      // Filter out $PATH/${PATH} self-references — they're not real directories
      const paths = rawValue
        .split(":")
        .map((p) => p.trim())
        .filter((p) => p !== "" && p !== "$PATH" && p !== "${PATH}");
      for (const p of paths) {
        result.pathEntries.push({
          id: nextId(),
          path: p,
          raw: line,
        });
      }
      if (paths.length === 0) {
        result.otherLines.push(line);
      }
      continue;
    }

    // Generic export (env var)
    const exportMatch = trimmed.match(RE_EXPORT);
    if (exportMatch) {
      const name = exportMatch[1];
      // Skip PATH since we handle it above
      if (name === "PATH") {
        result.otherLines.push(line);
        continue;
      }
      result.envVars.push({
        id: nextId(),
        name,
        value: unquote(exportMatch[2]),
        raw: line,
      });
      continue;
    }

    // Alias
    const aliasMatch = trimmed.match(RE_ALIAS);
    if (aliasMatch) {
      result.aliases.push({
        id: nextId(),
        name: aliasMatch[1],
        command: unquote(aliasMatch[2]),
        raw: line,
      });
      continue;
    }

    // Source / plugin
    const sourceMatch = trimmed.match(RE_SOURCE);
    if (sourceMatch) {
      result.sources.push({
        id: nextId(),
        path: unquote(sourceMatch[1]),
        raw: line,
      });
      continue;
    }

    // Everything else
    result.otherLines.push(line);
  }

  return result;
}

/**
 * Rebuilds zshrc content from structured data.
 * otherLines go first (comments, blank lines, unrecognized directives),
 * then structured sections with clear headers.
 */
export function buildZshrc(parsed: ZshrcParsed): string {
  const sections: string[] = [];

  // Preserve original other lines at the top
  if (parsed.otherLines.length > 0) {
    sections.push(parsed.otherLines.join("\n"));
  }

  // Environment variables
  if (parsed.envVars.length > 0) {
    const lines = parsed.envVars.map(
      (v) => `export ${v.name}=${quoteIfNeeded(v.value)}`
    );
    sections.push(lines.join("\n"));
  }

  // PATH entries — combine into single export
  if (parsed.pathEntries.length > 0) {
    // Append :$PATH to preserve existing system PATH entries
    const pathValue = parsed.pathEntries.map((p) => p.path).join(":");
    sections.push(`export PATH="${pathValue}:$PATH"`);
  }

  // Aliases
  if (parsed.aliases.length > 0) {
    const lines = parsed.aliases.map(
      (a) => `alias ${a.name}=${quoteIfNeeded(a.command)}`
    );
    sections.push(lines.join("\n"));
  }

  // Sources
  if (parsed.sources.length > 0) {
    const lines = parsed.sources.map((s) => `source ${s.path}`);
    sections.push(lines.join("\n"));
  }

  return sections.join("\n\n") + "\n";
}

function quoteIfNeeded(value: string): string {
  // If contains spaces, special chars, or is empty — quote it
  if (
    value === "" ||
    /[\s$`"'\\!#&|;()<>]/.test(value) ||
    value.includes(" ")
  ) {
    // Use double quotes, escape internal double quotes
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  return value;
}

export function createEmptyEnvVar(): ZshrcEnvVar {
  return { id: nextId(), name: "", value: "", raw: "" };
}

export function createEmptyAlias(): ZshrcAlias {
  return { id: nextId(), name: "", command: "", raw: "" };
}

export function createEmptyPathEntry(): ZshrcPathEntry {
  return { id: nextId(), path: "", raw: "" };
}

export function createEmptySource(): ZshrcSource {
  return { id: nextId(), path: "", raw: "" };
}

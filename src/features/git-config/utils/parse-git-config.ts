export interface GitConfigSection {
  name: string;
  entries: { key: string; value: string }[];
}

/** Parse INI-style gitconfig into structured sections */
export function parseGitConfig(content: string): GitConfigSection[] {
  const sections: GitConfigSection[] = [];
  let current: GitConfigSection | null = null;

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith(";")) continue;

    // Section header: [section] or [section "subsection"]
    const sectionMatch = trimmed.match(/^\[([^\]]+)\]$/);
    if (sectionMatch) {
      current = { name: sectionMatch[1].trim(), entries: [] };
      sections.push(current);
      continue;
    }

    // Key = value pair
    if (current) {
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex > 0) {
        const key = trimmed.slice(0, eqIndex).trim();
        const value = trimmed.slice(eqIndex + 1).trim();
        current.entries.push({ key, value });
      }
    }
  }

  return sections;
}

/** Rebuild gitconfig content from structured sections */
export function buildGitConfig(sections: GitConfigSection[]): string {
  return sections
    .map((s) => {
      const header = `[${s.name}]`;
      const entries = s.entries.map((e) => `\t${e.key} = ${e.value}`).join("\n");
      return entries ? `${header}\n${entries}` : header;
    })
    .join("\n");
}

/** Get a value from parsed sections by "section.key" notation */
export function getConfigValue(
  sections: GitConfigSection[],
  path: string,
): string | undefined {
  const dotIndex = path.indexOf(".");
  if (dotIndex < 0) return undefined;
  const sectionName = path.slice(0, dotIndex);
  const key = path.slice(dotIndex + 1);
  const section = sections.find((s) => s.name === sectionName);
  return section?.entries.find((e) => e.key === key)?.value;
}

/** Set a value in parsed sections by "section.key" notation */
export function setConfigValue(
  sections: GitConfigSection[],
  path: string,
  value: string,
): GitConfigSection[] {
  const dotIndex = path.indexOf(".");
  if (dotIndex < 0) return sections;
  const sectionName = path.slice(0, dotIndex);
  const key = path.slice(dotIndex + 1);

  const result = sections.map((s) => ({ ...s, entries: [...s.entries] }));
  let section = result.find((s) => s.name === sectionName);

  if (!section) {
    section = { name: sectionName, entries: [] };
    result.push(section);
  }

  const entry = section.entries.find((e) => e.key === key);
  if (entry) {
    entry.value = value;
  } else {
    section.entries.push({ key, value });
  }

  return result;
}

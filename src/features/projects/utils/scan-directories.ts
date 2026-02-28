import { Command } from "@tauri-apps/plugin-shell";
import { PROJECT_MARKERS, type ProjectType } from "./detect-project-type";

export interface ScannedProject {
  name: string;
  path: string;
  type: ProjectType;
  hasVscode: boolean;
  hasIdea: boolean;
}

async function runSh(cmd: string): Promise<string> {
  const r = await Command.create("exec-sh", ["-c", cmd]).execute();
  if (r.code !== 0) throw new Error(r.stderr || `Command failed: ${cmd}`);
  return r.stdout;
}

/** Expand ~ to $HOME */
function expandHome(dir: string): string {
  if (dir.startsWith("~/")) {
    return `$HOME/${dir.slice(2)}`;
  }
  return dir;
}

/**
 * Scan a single directory for projects up to given depth.
 * Uses `find` to list subdirectories, then checks for marker files.
 */
export async function scanDirectory(
  dir: string,
  depth: number,
): Promise<ScannedProject[]> {
  const expandedDir = expandHome(dir);

  // List subdirectories up to depth
  let output: string;
  try {
    output = await runSh(
      `find ${expandedDir} -mindepth 1 -maxdepth ${depth} -type d ! -name '.*' ! -path '*/node_modules/*' ! -path '*/.git/*' 2>/dev/null`,
    );
  } catch {
    return [];
  }

  const dirs = output.trim().split("\n").filter(Boolean);
  const projects: ScannedProject[] = [];
  const seen = new Set<string>();

  // Also check the root dir itself
  dirs.unshift(expandedDir);

  // Build a single batch check — for each dir, check all marker files
  for (const d of dirs) {
    if (seen.has(d)) continue;

    // Check marker files for this directory
    const markerChecks = PROJECT_MARKERS.map((m) => m.file);
    const checkCmd = markerChecks
      .map((f) => `test -f "${d}/${f}" && echo "${f}" || true`)
      .join("; ");

    let result: string;
    try {
      result = await runSh(checkCmd);
    } catch {
      continue;
    }

    const foundFiles = result.trim().split("\n").filter(Boolean);
    if (foundFiles.length === 0) continue;

    // Find the first matching marker
    let projectType: ProjectType = "unknown";
    for (const marker of PROJECT_MARKERS) {
      if (foundFiles.includes(marker.file)) {
        projectType = marker.type;
        break;
      }
    }

    if (projectType === "unknown") continue;

    // Check for IDE dirs
    let ideCheck: string;
    try {
      ideCheck = await runSh(
        `test -d "${d}/.vscode" && echo "vscode" || true; test -d "${d}/.idea" && echo "idea" || true`,
      );
    } catch {
      ideCheck = "";
    }

    const ideFlags = ideCheck.trim().split("\n");
    const name = d.split("/").pop() || d;

    seen.add(d);
    projects.push({
      name,
      path: d,
      type: projectType,
      hasVscode: ideFlags.includes("vscode"),
      hasIdea: ideFlags.includes("idea"),
    });
  }

  return projects;
}

/** Scan multiple directories and merge results */
export async function scanAllDirectories(
  dirs: string[],
  depth: number,
): Promise<ScannedProject[]> {
  const results = await Promise.all(dirs.map((d) => scanDirectory(d, depth)));
  return results.flat().sort((a, b) => a.name.localeCompare(b.name));
}

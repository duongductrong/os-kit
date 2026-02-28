import { stringify } from "yaml";
import { Command } from "@tauri-apps/plugin-shell";
import {
  loadInstallationSections,
  getAllTools,
} from "@/features/installation/utils/installation-data";
import type { AppSettings } from "@/hooks/use-settings-store";

async function runSh(cmd: string): Promise<string> {
  const r = await Command.create("exec-sh", ["-c", cmd]).execute();
  if (r.code !== 0) throw new Error(r.stderr);
  return r.stdout;
}

async function tryRun(cmd: string): Promise<string | null> {
  try {
    return await runSh(cmd);
  } catch {
    return null;
  }
}

export interface Recipe {
  version: number;
  exported_at: string;
  tools: { id: string }[];
  settings: Partial<AppSettings>;
  configs?: Record<string, string>;
}

/** Build a recipe YAML string from current system state */
export async function serializeRecipe(
  settings: AppSettings,
  includeConfigs: boolean,
): Promise<string> {
  const sections = loadInstallationSections();
  const allTools = getAllTools(sections);

  // Check which tools are installed
  const installedTools: { id: string }[] = [];
  for (const tool of allTools) {
    if (!tool.checkCommand) continue;
    try {
      const r = await Command.create("exec-sh", ["-c", tool.checkCommand]).execute();
      if (r.code === 0) {
        installedTools.push({ id: tool.id });
      }
    } catch {
      // skip
    }
  }

  const recipe: Recipe = {
    version: 1,
    exported_at: new Date().toISOString(),
    tools: installedTools,
    settings: {
      theme: settings.theme,
      preferredIDE: settings.preferredIDE,
      scanDirectories: settings.scanDirectories,
      scanDepth: settings.scanDepth,
      fontSize: settings.fontSize,
    },
  };

  if (includeConfigs) {
    const configs: Record<string, string> = {};
    const gitconfig = await tryRun("cat ~/.gitconfig 2>/dev/null");
    if (gitconfig) configs.gitconfig = gitconfig;
    recipe.configs = Object.keys(configs).length > 0 ? configs : undefined;
  }

  return stringify(recipe);
}

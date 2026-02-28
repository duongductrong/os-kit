import { Command } from "@tauri-apps/plugin-shell";
import { useCallback, useState } from "react";
import { useSettings } from "@/contexts/settings-context";
import { serializeRecipe } from "../utils/serialize-recipe";
import { parseRecipe, type Recipe } from "../utils/parse-recipe";
import {
  loadInstallationSections,
  getAllTools,
} from "@/features/installation/utils/installation-data";
import type { AppSettings } from "@/hooks/use-settings-store";

async function runSh(cmd: string): Promise<string> {
  const r = await Command.create("exec-sh", ["-c", cmd]).execute();
  if (r.code !== 0) throw new Error(r.stderr || `Command failed: ${cmd}`);
  return r.stdout;
}

export interface RecipeDiffItem {
  toolId: string;
  toolName: string;
  status: "installed" | "will_install" | "not_available";
}

export function useRecipe() {
  const { settings, updateSetting } = useSettings();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importedRecipe, setImportedRecipe] = useState<Recipe | null>(null);
  const [diff, setDiff] = useState<RecipeDiffItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const exportRecipe = useCallback(
    async (includeConfigs: boolean) => {
      setIsExporting(true);
      setError(null);
      try {
        const yaml = await serializeRecipe(settings, includeConfigs);
        const home = (await runSh("echo $HOME")).trim();
        const exportPath = `${home}/Desktop/oskit-recipe.yaml`;
        // Base64-encode to avoid all shell escaping issues with YAML content
        const b64 = btoa(unescape(encodeURIComponent(yaml)));
        await runSh(`echo '${b64}' | base64 --decode > "${exportPath}"`);
        setError(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("Recipe export error:", err);
        setError(`Export failed: ${msg}`);
      } finally {
        setIsExporting(false);
      }
    },
    [settings],
  );

  const importRecipeFromPath = useCallback(
    async (filePath: string) => {
      setError(null);
      try {
        const content = await runSh(`cat "${filePath}"`);
        const recipe = parseRecipe(content);
        setImportedRecipe(recipe);

        // Build diff
        const sections = loadInstallationSections();
        const allTools = getAllTools(sections);
        const diffItems: RecipeDiffItem[] = [];

        for (const { id } of recipe.tools) {
          const tool = allTools.find((t) => t.id === id);
          if (!tool) {
            diffItems.push({ toolId: id, toolName: id, status: "not_available" });
            continue;
          }

          let installed = false;
          if (tool.checkCommand) {
            try {
              const r = await Command.create("exec-sh", ["-c", tool.checkCommand]).execute();
              installed = r.code === 0;
            } catch {
              // skip
            }
          }

          diffItems.push({
            toolId: id,
            toolName: tool.name,
            status: installed ? "installed" : "will_install",
          });
        }

        setDiff(diffItems);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Import failed");
      }
    },
    [],
  );

  const applyRecipe = useCallback(async () => {
    if (!importedRecipe) return;
    setIsImporting(true);
    setError(null);

    try {
      // Apply settings
      if (importedRecipe.settings) {
        const settingsToApply = importedRecipe.settings as Partial<AppSettings>;
        for (const [key, value] of Object.entries(settingsToApply)) {
          if (value !== undefined && key in settings) {
            await updateSetting(key as keyof AppSettings, value as never);
          }
        }
      }

      // Install missing tools
      const sections = loadInstallationSections();
      const allTools = getAllTools(sections);
      const toInstall = diff.filter((d) => d.status === "will_install");

      for (const item of toInstall) {
        const tool = allTools.find((t) => t.id === item.toolId);
        if (!tool?.installCommand) continue;
        try {
          await Command.create("exec-sh", ["-c", tool.installCommand]).execute();
        } catch (err) {
          console.error(`Failed to install ${item.toolId}:`, err);
        }
      }

      // Apply configs (with backup)
      if (importedRecipe.configs?.gitconfig) {
        try {
          await runSh("cp ~/.gitconfig ~/.gitconfig.bak 2>/dev/null; true");
          const escaped = importedRecipe.configs.gitconfig.replace(/'/g, "'\\''");
          await runSh(`printf '%s' '${escaped}' > ~/.gitconfig`);
        } catch (err) {
          console.error("Failed to apply gitconfig:", err);
        }
      }

      setImportedRecipe(null);
      setDiff([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Apply failed");
    } finally {
      setIsImporting(false);
    }
  }, [importedRecipe, diff, settings, updateSetting]);

  const clearImport = useCallback(() => {
    setImportedRecipe(null);
    setDiff([]);
    setError(null);
  }, []);

  return {
    isExporting,
    isImporting,
    importedRecipe,
    diff,
    error,
    exportRecipe,
    importRecipeFromPath,
    applyRecipe,
    clearImport,
  };
}

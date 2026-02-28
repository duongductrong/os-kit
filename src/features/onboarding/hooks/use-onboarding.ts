import { Command } from "@tauri-apps/plugin-shell";
import { useCallback, useState } from "react";
import { useSettings } from "@/contexts/settings-context";
import {
  loadInstallationSections,
  getAllTools,
  type InstallTool,
} from "@/features/installation/utils/installation-data";

async function runSh(cmd: string) {
  const r = await Command.create("exec-sh", ["-c", cmd]).execute();
  return r.code === 0;
}

export interface ToolScanResult {
  tool: InstallTool;
  installed: boolean;
}

export function useOnboarding() {
  const { updateSetting } = useSettings();
  const [currentStep, setCurrentStep] = useState(1);
  const [scanResults, setScanResults] = useState<ToolScanResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>([]);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState<Record<string, "pending" | "installing" | "done" | "failed">>({});

  const totalSteps = 6;

  const next = useCallback(() => {
    setCurrentStep((s) => Math.min(s + 1, totalSteps));
  }, []);

  const prev = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 1));
  }, []);

  const skip = useCallback(async () => {
    await updateSetting("onboardingSkipped", true);
  }, [updateSetting]);

  const complete = useCallback(async () => {
    await updateSetting("onboardingCompleted", true);
  }, [updateSetting]);

  /** Scan all tools from installations.yaml */
  const scanTools = useCallback(async () => {
    setIsScanning(true);
    const sections = loadInstallationSections();
    const tools = getAllTools(sections);

    const results: ToolScanResult[] = [];
    // Scan in parallel batches of 5
    for (let i = 0; i < tools.length; i += 5) {
      const batch = tools.slice(i, i + 5);
      const batchResults = await Promise.all(
        batch.map(async (tool) => {
          if (!tool.checkCommand) return { tool, installed: false };
          const installed = await runSh(tool.checkCommand);
          return { tool, installed };
        }),
      );
      results.push(...batchResults);
    }

    setScanResults(results);
    setIsScanning(false);
  }, []);

  /** Toggle a tool selection */
  const toggleTool = useCallback((toolId: string) => {
    setSelectedToolIds((prev) =>
      prev.includes(toolId)
        ? prev.filter((id) => id !== toolId)
        : [...prev, toolId],
    );
  }, []);

  /** Select a starter pack */
  const selectPack = useCallback((toolIds: string[]) => {
    setSelectedToolIds(toolIds);
  }, []);

  /** Install selected tools */
  const installSelected = useCallback(async () => {
    setIsInstalling(true);
    const sections = loadInstallationSections();
    const allTools = getAllTools(sections);

    // Init progress
    const progress: Record<string, "pending" | "installing" | "done" | "failed"> = {};
    for (const id of selectedToolIds) {
      progress[id] = "pending";
    }
    setInstallProgress({ ...progress });

    for (const toolId of selectedToolIds) {
      const tool = allTools.find((t) => t.id === toolId);
      if (!tool?.installCommand) {
        progress[toolId] = "done";
        setInstallProgress({ ...progress });
        continue;
      }

      // Check if already installed
      if (tool.checkCommand) {
        const alreadyInstalled = await runSh(tool.checkCommand);
        if (alreadyInstalled) {
          progress[toolId] = "done";
          setInstallProgress({ ...progress });
          continue;
        }
      }

      progress[toolId] = "installing";
      setInstallProgress({ ...progress });

      try {
        const r = await Command.create("exec-sh", ["-c", tool.installCommand]).execute();
        progress[toolId] = r.code === 0 ? "done" : "failed";
      } catch {
        progress[toolId] = "failed";
      }
      setInstallProgress({ ...progress });
    }

    setIsInstalling(false);
  }, [selectedToolIds]);

  return {
    currentStep,
    totalSteps,
    scanResults,
    isScanning,
    selectedToolIds,
    isInstalling,
    installProgress,
    next,
    prev,
    skip,
    complete,
    scanTools,
    toggleTool,
    selectPack,
    installSelected,
  };
}

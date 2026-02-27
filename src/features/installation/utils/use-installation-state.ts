import { useCallback, useMemo } from "react";
import { getAllTools, installationSections } from "./installation-data";
import type { ToolStatus } from "@/lib/types";
import {
  useMultiToolDetection,
  type ToolDetectionConfig,
} from "@/hooks/use-tool-detection";

export function useInstallationState() {
  // Build detection configs from all tools that have a checkCommand
  const detectionConfigs: ToolDetectionConfig[] = useMemo(() => {
    return getAllTools(installationSections)
      .filter((t) => t.checkCommand)
      .map((t) => ({
        id: t.id,
        checkCommand: t.checkCommand!,
        installCommand: t.installCommand,
      }));
  }, []);

  const detection = useMultiToolDetection(detectionConfigs);

  // Build a complete status map (tools without checkCommand stay "idle")
  const statusMap: Record<string, ToolStatus> = useMemo(() => {
    const map: Record<string, ToolStatus> = {};
    for (const tool of getAllTools(installationSections)) {
      map[tool.id] = detection.statusMap[tool.id] ?? "idle";
    }
    return map;
  }, [detection.statusMap]);

  const installTool = useCallback(
    (toolId: string) => {
      const installer = detection.installMap[toolId];
      if (installer) {
        installer();
      }
    },
    [detection.installMap],
  );

  const retryTool = useCallback(
    (toolId: string) => {
      installTool(toolId);
    },
    [installTool],
  );

  const isPrerequisiteMet = useMemo(() => {
    return installationSections
      .filter((s) => s.isPrerequisite)
      .every((s) => s.tools.every((t) => statusMap[t.id] === "installed"));
  }, [statusMap]);

  const isCheckingPrerequisite = useMemo(() => {
    return installationSections
      .filter((s) => s.isPrerequisite)
      .some((s) => s.tools.some((t) => detection.checkingMap[t.id]));
  }, [detection.checkingMap]);

  const allTools = useMemo(() => getAllTools(installationSections), []);
  const installedCount = useMemo(
    () => allTools.filter((t) => statusMap[t.id] === "installed").length,
    [allTools, statusMap],
  );
  const totalCount = allTools.length;
  const progressPercent =
    totalCount > 0 ? (installedCount / totalCount) * 100 : 0;

  return {
    sections: installationSections,
    statusMap,
    installTool,
    retryTool,
    isPrerequisiteMet,
    isCheckingPrerequisite,
    installedCount,
    totalCount,
    progressPercent,
  };
}

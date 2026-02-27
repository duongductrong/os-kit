import { useCallback, useMemo } from "react";
import {
  getAllTools,
  getToolAction,
  loadInstallationSections,
} from "./installation-data";
import type { ToolAction } from "./installation-data";
import type { ToolStatus } from "@/lib/types";
import {
  useMultiToolDetection,
  type StreamCallbacks,
  type ToolDetectionConfig,
} from "@/hooks/use-tool-detection";
import { useToolLogs } from "@/hooks/use-tool-logs";

export function useInstallationState() {
  // Load sections from YAML (synchronous — bundled at build time)
  const sections = useMemo(() => loadInstallationSections(), []);

  // Log state management
  const { logsMap, appendLog, startLog, endLog, clearLog } = useToolLogs();

  // Build detection configs from all tools that have a checkCommand
  const detectionConfigs: ToolDetectionConfig[] = useMemo(() => {
    return getAllTools(sections)
      .filter((t) => t.checkCommand)
      .map((t) => ({
        id: t.id,
        checkCommand: t.checkCommand!,
        installCommand: t.installCommand,
        // Extract upgrade/uninstall commands from actions for detection hook
        upgradeCommand: getToolAction(t, "upgrade")?.command,
        uninstallCommand: getToolAction(t, "uninstall")?.command,
        versionCommand: t.versionCommand,
      }));
  }, [sections]);

  const detection = useMultiToolDetection(detectionConfigs);

  // Build a complete status map (tools without checkCommand stay "idle")
  const statusMap: Record<string, ToolStatus> = useMemo(() => {
    const map: Record<string, ToolStatus> = {};
    for (const tool of getAllTools(sections)) {
      map[tool.id] = detection.statusMap[tool.id] ?? "idle";
    }
    return map;
  }, [sections, detection.statusMap]);

  // Build actions map: toolId → ToolAction[]
  const actionsMap: Record<string, ToolAction[]> = useMemo(() => {
    const map: Record<string, ToolAction[]> = {};
    for (const tool of getAllTools(sections)) {
      map[tool.id] = tool.actions ?? [];
    }
    return map;
  }, [sections]);

  /** Create StreamCallbacks that pipe output into the log store */
  const makeStreamCallbacks = useCallback(
    (toolId: string): StreamCallbacks => ({
      onStart: () => startLog(toolId),
      onStdout: (line: string) =>
        appendLog(toolId, {
          text: line,
          stream: "stdout",
          timestamp: Date.now(),
        }),
      onStderr: (line: string) =>
        appendLog(toolId, {
          text: line,
          stream: "stderr",
          timestamp: Date.now(),
        }),
      onEnd: (exitCode: number) => endLog(toolId, exitCode),
    }),
    [appendLog, startLog, endLog],
  );

  const installTool = useCallback(
    (toolId: string) => {
      const installer = detection.installMap[toolId];
      if (installer) {
        installer(makeStreamCallbacks(toolId));
      }
    },
    [detection.installMap, makeStreamCallbacks],
  );

  const executeAction = useCallback(
    (toolId: string, actionId: string) => {
      const stream = makeStreamCallbacks(toolId);
      if (actionId === "upgrade") {
        const upgrader = detection.upgradeMap[toolId];
        if (upgrader) upgrader(stream);
      } else if (actionId === "uninstall") {
        const uninstaller = detection.uninstallMap[toolId];
        if (uninstaller) uninstaller(stream);
      }
      // Future: handle custom action IDs via a generic exec mechanism
    },
    [detection.upgradeMap, detection.uninstallMap, makeStreamCallbacks],
  );

  const retryTool = useCallback(
    (toolId: string) => {
      installTool(toolId);
    },
    [installTool],
  );

  const isPrerequisiteMet = useMemo(() => {
    return sections
      .filter((s) => s.isPrerequisite)
      .every((s) => s.tools.every((t) => statusMap[t.id] === "installed"));
  }, [sections, statusMap]);

  const isCheckingPrerequisite = useMemo(() => {
    return sections
      .filter((s) => s.isPrerequisite)
      .some((s) => s.tools.some((t) => detection.checkingMap[t.id]));
  }, [sections, detection.checkingMap]);

  const allTools = useMemo(() => getAllTools(sections), [sections]);
  const installedCount = useMemo(
    () => allTools.filter((t) => statusMap[t.id] === "installed").length,
    [allTools, statusMap],
  );
  const totalCount = allTools.length;
  const progressPercent =
    totalCount > 0 ? (installedCount / totalCount) * 100 : 0;

  return {
    sections,
    statusMap,
    versionMap: detection.versionMap,
    actionsMap,
    logsMap,
    installTool,
    executeAction,
    retryTool,
    clearLog,
    isPrerequisiteMet,
    isCheckingPrerequisite,
    installedCount,
    totalCount,
    progressPercent,
  };
}

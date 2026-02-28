import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getAllTools,
  getToolAction,
  getEffectiveActionCommand,
  loadInstallationSections,
} from "./installation-data";
import type { ToolAction, ManagedBy } from "./installation-data";
import type { ToolStatus } from "@/lib/types";
import {
  useMultiToolDetection,
  spawnSh,
  type StreamCallbacks,
  type ToolDetectionConfig,
} from "@/hooks/use-tool-detection";
import { useToolLogs } from "@/hooks/use-tool-logs";
import { Command } from "@tauri-apps/plugin-shell";

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
        sizeCommand: t.sizeCommand,
        brewCaskName: t.brewCaskName,
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

  // Build managedBy map
  const managedByMap: Record<string, ManagedBy> = useMemo(() => {
    const map: Record<string, ManagedBy> = {};
    for (const tool of getAllTools(sections)) {
      map[tool.id] = detection.managedByMap[tool.id] ?? "manual";
    }
    return map;
  }, [sections, detection.managedByMap]);

  // Build effective actions map: filters out actions that have no usable command
  // for the current install source, and resolves fallback commands
  const effectiveActionsMap: Record<string, ToolAction[]> = useMemo(() => {
    const map: Record<string, ToolAction[]> = {};
    for (const tool of getAllTools(sections)) {
      const managed = managedByMap[tool.id] ?? "manual";
      const filtered: ToolAction[] = [];
      for (const action of tool.actions ?? []) {
        const effectiveCmd = getEffectiveActionCommand(action, managed);
        if (effectiveCmd) {
          // Replace the command with the effective one (may be fallback)
          filtered.push({ ...action, command: effectiveCmd });
        }
        // If effectiveCmd is undefined, action is hidden
      }
      map[tool.id] = filtered;
    }
    return map;
  }, [sections, managedByMap]);

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
    async (toolId: string, actionId: string) => {
      // Look up the effective action (already resolved for brew vs manual)
      const effectiveAction = effectiveActionsMap[toolId]?.find(
        (a) => a.id === actionId,
      );
      if (!effectiveAction?.command) return;

      // Check if the effective command differs from the primary command
      // (i.e., we're using a fallback command for a manually-installed app)
      const primaryAction = getAllTools(sections)
        .find((t) => t.id === toolId)
        ?.actions?.find((a) => a.id === actionId);
      const isPrimaryCommand =
        effectiveAction.command === primaryAction?.command;

      if (isPrimaryCommand) {
        // Use the detection hook's built-in methods (they handle status transitions)
        const stream = makeStreamCallbacks(toolId);
        if (actionId === "upgrade") {
          const upgrader = detection.upgradeMap[toolId];
          if (upgrader) upgrader(stream);
        } else if (actionId === "uninstall") {
          const uninstaller = detection.uninstallMap[toolId];
          if (uninstaller) uninstaller(stream);
        }
      } else {
        // Using a fallback command — spawn directly
        const stream = makeStreamCallbacks(toolId);
        try {
          const exitCode = await spawnSh(effectiveAction.command, stream);
          stream.onEnd?.(exitCode);
        } catch (err) {
          console.error(`Action ${actionId} for ${toolId} error:`, err);
          stream.onEnd?.(-1);
        }
      }
    },
    [
      detection.upgradeMap,
      detection.uninstallMap,
      effectiveActionsMap,
      sections,
      makeStreamCallbacks,
    ],
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

  // Outdated packages map: tool ID → latest version
  const [outdatedMap, setOutdatedMap] = useState<Record<string, string>>({});
  useEffect(() => {
    let cancelled = false;
    async function fetchOutdated() {
      try {
        const result = await Command.create("exec-sh", [
          "-c",
          "/opt/homebrew/bin/brew outdated --json=v2 2>/dev/null",
        ]).execute();
        if (cancelled || result.code !== 0 || !result.stdout.trim()) return;
        const json = JSON.parse(result.stdout);
        const map: Record<string, string> = {};
        for (const f of json.formulae ?? []) {
          map[f.name] = f.current_version;
        }
        for (const c of json.casks ?? []) {
          map[c.name] = c.current_version;
        }
        if (!cancelled) setOutdatedMap(map);
      } catch {
        // Homebrew not installed — skip
      }
    }
    fetchOutdated();
    return () => { cancelled = true; };
  }, []);

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
    sizeMap: detection.sizeMap,
    managedByMap,
    actionsMap: effectiveActionsMap,
    logsMap,
    outdatedMap,
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

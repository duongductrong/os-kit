import { useCallback, useEffect, useMemo, useState } from "react";
import { getAllTools, installationSections } from "./installation-data";
import type { ToolStatus } from "@/lib/types";
import { useHomebrew } from "@/hooks/use-homebrew";

type ToolStatusMap = Record<string, ToolStatus>;

export function useInstallationState() {
  const homebrew = useHomebrew();

  const [statusMap, setStatusMap] = useState<ToolStatusMap>(() => {
    const map: ToolStatusMap = {};
    for (const tool of getAllTools(installationSections)) {
      map[tool.id] = "idle";
    }
    return map;
  });

  // Sync Homebrew real status into the status map
  useEffect(() => {
    setStatusMap((prev) => ({ ...prev, homebrew: homebrew.status }));
  }, [homebrew.status]);

  const installTool = useCallback(
    (toolId: string) => {
      // For Homebrew, use the real installer
      if (toolId === "homebrew") {
        homebrew.installHomebrew();
        return;
      }

      // For other tools, still mock for now
      setStatusMap((prev) => ({ ...prev, [toolId]: "installing" }));
      const delay = 1500 + Math.random() * 1500;
      setTimeout(() => {
        setStatusMap((prev) => ({ ...prev, [toolId]: "installed" }));
      }, delay);
    },
    [homebrew],
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
    isCheckingPrerequisite: homebrew.checking,
    installedCount,
    totalCount,
    progressPercent,
  };
}

import { useCallback, useMemo } from "react";
import { useConfigFile } from "@/hooks/use-config-file";
import {
  parseHosts,
  buildHosts,
  type HostsEntry,
} from "../utils/parse-hosts";

export function useHostsFile() {
  const configFile = useConfigFile({
    path: "/etc/hosts",
    sudo: true,
  });

  const entries = useMemo(
    () => parseHosts(configFile.content),
    [configFile.content],
  );

  const systemEntries = useMemo(
    () => entries.filter((e) => e.isSystem),
    [entries],
  );

  const userEntries = useMemo(
    () => entries.filter((e) => !e.isSystem),
    [entries],
  );

  const toggleEntry = useCallback(
    (lineIndex: number) => {
      const updated = entries.map((e) =>
        e.lineIndex === lineIndex ? { ...e, enabled: !e.enabled } : e,
      );
      configFile.setContent(buildHosts(configFile.content, updated));
    },
    [entries, configFile],
  );

  const addEntry = useCallback(
    (ip: string, hostname: string, comment?: string) => {
      const newLineIndex = configFile.content.split("\n").length;
      const newEntry: HostsEntry = {
        ip,
        hostname,
        comment: comment ?? "",
        enabled: true,
        isSystem: false,
        lineIndex: newLineIndex,
      };
      const updated = [...entries, newEntry];
      configFile.setContent(buildHosts(configFile.content, updated));
    },
    [entries, configFile],
  );

  const removeEntry = useCallback(
    (lineIndex: number) => {
      // Remove by replacing the line with empty
      const lines = configFile.content.split("\n");
      lines[lineIndex] = "";
      configFile.setContent(lines.join("\n"));
    },
    [configFile],
  );

  return {
    ...configFile,
    entries,
    systemEntries,
    userEntries,
    toggleEntry,
    addEntry,
    removeEntry,
  };
}

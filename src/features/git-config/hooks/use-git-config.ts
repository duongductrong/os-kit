import { useMemo, useCallback } from "react";
import { useConfigFile } from "@/hooks/use-config-file";
import {
  parseGitConfig,
  buildGitConfig,
  getConfigValue,
  setConfigValue,
} from "../utils/parse-git-config";

export function useGitConfig() {
  const configFile = useConfigFile({
    path: "~/.gitconfig",
    createIfMissing: true,
  });

  const sections = useMemo(
    () => parseGitConfig(configFile.content),
    [configFile.content],
  );

  const getValue = useCallback(
    (path: string) => getConfigValue(sections, path) ?? "",
    [sections],
  );

  const setValue = useCallback(
    (path: string, value: string) => {
      const updated = setConfigValue(sections, path, value);
      configFile.setContent(buildGitConfig(updated));
    },
    [sections, configFile],
  );

  /** Get all entries from [alias] section */
  const aliases = useMemo(() => {
    const aliasSection = sections.find((s) => s.name === "alias");
    return aliasSection?.entries ?? [];
  }, [sections]);

  const addAlias = useCallback(
    (name: string, command: string) => {
      const updated = setConfigValue(sections, `alias.${name}`, command);
      configFile.setContent(buildGitConfig(updated));
    },
    [sections, configFile],
  );

  const removeAlias = useCallback(
    (name: string) => {
      const updated = sections.map((s) => {
        if (s.name !== "alias") return s;
        return { ...s, entries: s.entries.filter((e) => e.key !== name) };
      });
      configFile.setContent(buildGitConfig(updated));
    },
    [sections, configFile],
  );

  return {
    ...configFile,
    sections,
    getValue,
    setValue,
    aliases,
    addAlias,
    removeAlias,
  };
}

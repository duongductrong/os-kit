import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { InstallationSearchbar } from "@/features/installation/components/installation-searchbar";
import { InstallationSection } from "@/features/installation/components/installation-section";
import { useInstallationState } from "@/features/installation/utils/use-installation-state";

export const Route = createFileRoute("/installation")({
  component: Installation,
});

export default function Installation() {
  const {
    sections,
    statusMap,
    versionMap,
    managedByMap,
    actionsMap,
    logsMap,
    installTool,
    executeAction,
    retryTool,
    clearLog,
    isPrerequisiteMet,
    isCheckingPrerequisite,
  } = useInstallationState();

  const [searchQuery, setSearchQuery] = useState("");

  const filteredSections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return sections;

    return sections
      .map((section) => ({
        ...section,
        tools: section.tools.filter(
          (tool) =>
            tool.name.toLowerCase().includes(query) ||
            tool.description.toLowerCase().includes(query),
        ),
      }))
      .filter((section) => section.tools.length > 0);
  }, [sections, searchQuery]);

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto w-full">
      {/* Page header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Installation</h1>
        <p className="text-sm text-muted-foreground">
          Install developer tools on your Mac with one click. Start with
          Homebrew, then install everything else.
        </p>
      </div>

      <InstallationSearchbar value={searchQuery} onChange={setSearchQuery} />

      {/* Sections flow */}
      <div className="flex flex-col gap-6">
        {filteredSections.map((section, index) => {
          const isLocked = !section.isPrerequisite && !isPrerequisiteMet;
          return (
            <InstallationSection
              key={section.id}
              section={section}
              statusMap={statusMap}
              versionMap={versionMap}
              managedByMap={managedByMap}
              actionsMap={actionsMap}
              logsMap={logsMap}
              onInstall={installTool}
              onRetry={retryTool}
              onAction={executeAction}
              onClearLog={clearLog}
              isLocked={isLocked}
              isChecking={section.isPrerequisite && isCheckingPrerequisite}
              showConnector={index > 0}
            />
          );
        })}

        {searchQuery && filteredSections.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No tools found matching "{searchQuery}"
          </p>
        )}
      </div>
    </div>
  );
}

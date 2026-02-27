import { createFileRoute } from "@tanstack/react-router";

import { InstallationProgress } from "@/features/installation/components/installation-progress";
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
  } = useInstallationState();

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto w-full">
      {/* Page header with progress */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Installation</h1>
        <p className="text-sm text-muted-foreground">
          Install developer tools on your Mac with one click. Start with
          Homebrew, then install everything else.
        </p>
      </div>

      <InstallationProgress
        installedCount={installedCount}
        totalCount={totalCount}
        progressPercent={progressPercent}
      />

      {/* Sections flow */}
      <div className="flex flex-col gap-6">
        {sections.map((section, index) => {
          const isLocked = !section.isPrerequisite && !isPrerequisiteMet;
          return (
            <InstallationSection
              key={section.id}
              section={section}
              statusMap={statusMap}
              versionMap={versionMap}
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
      </div>
    </div>
  );
}

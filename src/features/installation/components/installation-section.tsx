import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle,
} from "@/components/ui/section";
import { cn } from "@/lib/utils";
import type {
  InstallSection,
  ToolAction,
  ToolStatus,
  ManagedBy,
} from "../utils/installation-data";
import type { ToolLogState } from "@/hooks/use-tool-logs";
import { InstallationItem } from "./installation-item";

interface InstallationSectionProps {
  section: InstallSection;
  statusMap: Record<string, ToolStatus>;
  versionMap: Record<string, string | null>;
  sizeMap: Record<string, string | null>;
  managedByMap: Record<string, ManagedBy>;
  actionsMap: Record<string, ToolAction[]>;
  logsMap: Record<string, ToolLogState>;
  onInstall: (toolId: string) => void;
  onRetry: (toolId: string) => void;
  onAction: (toolId: string, actionId: string) => void;
  onClearLog: (toolId: string) => void;
  isLocked: boolean;
  isChecking?: boolean;
  showConnector?: boolean;
}

export function InstallationSection({
  section,
  statusMap,
  versionMap,
  sizeMap,
  managedByMap,
  actionsMap,
  logsMap,
  onInstall,
  onRetry,
  onAction,
  onClearLog,
  isLocked,
  isChecking = false,
  showConnector = false,
}: InstallationSectionProps) {
  return (
    <div className="relative">
      {/* Vertical connector line */}
      {showConnector && (
        <div className="absolute -top-5 left-5 h-5 w-px border-l-2 border-dashed border-border" />
      )}

      <Section
        className={cn(
          "transition-opacity duration-300",
          isLocked && "pointer-events-none opacity-50",
        )}
      >
        <SectionHeader>
          <div className="flex items-center gap-2">
            <SectionTitle>{section.title}</SectionTitle>
            {isChecking && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground animate-pulse">
                Checking…
              </span>
            )}
            {isLocked && !isChecking && (
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                🔒 Requires Homebrew
              </span>
            )}
          </div>
          {section.description && (
            <SectionDescription>{section.description}</SectionDescription>
          )}
        </SectionHeader>

        <SectionContent>
          {section.tools.map((tool) => {
            const actions = actionsMap[tool.id] ?? [];
            return (
              <InstallationItem
                key={tool.id}
                tool={tool}
                status={statusMap[tool.id] ?? "idle"}
                version={versionMap[tool.id] ?? null}
                size={sizeMap[tool.id] ?? null}
                managedBy={managedByMap[tool.id] ?? "manual"}
                actions={actions}
                logState={logsMap[tool.id]}
                onInstall={() => onInstall(tool.id)}
                onRetry={() => onRetry(tool.id)}
                onAction={(actionId) => onAction(tool.id, actionId)}
                onClearLog={() => onClearLog(tool.id)}
                disabled={isLocked}
              />
            );
          })}
        </SectionContent>
      </Section>
    </div>
  );
}

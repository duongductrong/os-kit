import { parse } from "yaml";
import rawYaml from "@/config/installations.yaml?raw";

export type { ToolStatus } from "@/lib/types";

export interface ToolAction {
  /** Unique action identifier (e.g. "upgrade", "uninstall", or custom) */
  id: string;
  /** Display label shown in the dropdown menu */
  label: string;
  /** Shell command to execute for this action */
  command: string;
  /** Fallback command when app is not brew-managed (empty string = hide action) */
  fallbackCommand?: string;
  /** Optional variant for styling (e.g. "destructive" for red) */
  variant?: string;
  /** If true, render a separator line above this action */
  separatorBefore?: boolean;
}

export interface InstallTool {
  id: string;
  name: string;
  description: string;
  icon: string;
  /** Shell command to check if this tool is installed (exit 0 = installed) */
  checkCommand?: string;
  /** Shell command to install this tool */
  installCommand?: string;
  /** Shell command to get the current version (stdout is captured) */
  versionCommand?: string;
  /** Shell command to get the disk size (stdout like "1.2G" or "450M") */
  sizeCommand?: string;
  /** Whether this tool has an expandable detail panel */
  hasDetails?: boolean;
  /** Homebrew cask name — enables brew-management detection at runtime */
  brewCaskName?: string;
  /** Configurable actions shown in the tool's dropdown menu */
  actions?: ToolAction[];
}

export interface InstallSection {
  id: string;
  title: string;
  description?: string;
  isPrerequisite?: boolean;
  tools: InstallTool[];
}

interface InstallationsConfig {
  sections: InstallSection[];
}

/** Parse the bundled YAML and return typed installation sections */
export function loadInstallationSections(): InstallSection[] {
  const config = parse(rawYaml) as InstallationsConfig;
  return config.sections;
}

/** Get all tools from all sections as a flat array */
export function getAllTools(sections: InstallSection[]): InstallTool[] {
  return sections.flatMap((s) => s.tools);
}

/** How a tool was installed */
export type ManagedBy = "brew" | "manual";

/** Look up a specific action by ID on a tool */
export function getToolAction(
  tool: InstallTool,
  actionId: string,
): ToolAction | undefined {
  return tool.actions?.find((a) => a.id === actionId);
}

/**
 * Get the effective command for an action based on how the tool is managed.
 * Returns undefined if the action should be hidden (fallbackCommand is empty string).
 */
export function getEffectiveActionCommand(
  action: ToolAction,
  managedBy: ManagedBy,
): string | undefined {
  if (managedBy === "brew") {
    return action.command;
  }
  // Not brew-managed: use fallback if provided
  if (action.fallbackCommand !== undefined) {
    // Empty string means "hide this action"
    return action.fallbackCommand || undefined;
  }
  // No fallback defined: use the primary command (for non-brew tools like nvm, rust, etc.)
  return action.command;
}

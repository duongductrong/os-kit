export type { ToolStatus } from "@/lib/types";

export interface InstallTool {
  id: string;
  name: string;
  description: string;
  icon: string;
  brewName?: string;
}

export interface InstallSection {
  id: string;
  title: string;
  description?: string;
  isPrerequisite?: boolean;
  tools: InstallTool[];
}

export const installationSections: InstallSection[] = [
  {
    id: "package-manager",
    title: "Package Manager",
    description: "Required before installing other tools",
    isPrerequisite: true,
    tools: [
      {
        id: "homebrew",
        name: "Homebrew",
        description: "The Missing Package Manager for macOS",
        icon: "🍺",
        brewName: "homebrew",
      },
    ],
  },
  {
    id: "dev-essentials",
    title: "Development Essentials",
    description: "Core tools for software development",
    tools: [
      {
        id: "git",
        name: "Git",
        description: "Distributed version control system",
        icon: "🔀",
        brewName: "git",
      },
      {
        id: "node",
        name: "Node.js",
        description: "JavaScript runtime built on V8 engine",
        icon: "🟩",
        brewName: "node",
      },
      {
        id: "python",
        name: "Python",
        description: "General-purpose programming language",
        icon: "🐍",
        brewName: "python",
      },
      {
        id: "go",
        name: "Go",
        description: "Statically typed, compiled language by Google",
        icon: "🐹",
        brewName: "go",
      },
      {
        id: "rust",
        name: "Rust",
        description: "Fast, memory-safe systems programming language",
        icon: "🦀",
        brewName: "rustup",
      },
    ],
  },
  {
    id: "terminal-shell",
    title: "Terminal & Shell",
    description: "Enhance your terminal experience",
    tools: [
      {
        id: "iterm2",
        name: "iTerm2",
        description: "Feature-rich terminal emulator for macOS",
        icon: "🖥️",
        brewName: "iterm2",
      },
      {
        id: "ohmyzsh",
        name: "Oh My Zsh",
        description: "Framework for managing Zsh configuration",
        icon: "⚡",
      },
      {
        id: "starship",
        name: "Starship",
        description: "Minimal, fast, and customizable shell prompt",
        icon: "🚀",
        brewName: "starship",
      },
    ],
  },
];

/** Get all tools from all sections as a flat array */
export function getAllTools(sections: InstallSection[]): InstallTool[] {
  return sections.flatMap((s) => s.tools);
}

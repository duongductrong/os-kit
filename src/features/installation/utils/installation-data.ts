export type { ToolStatus } from "@/lib/types";

export interface InstallTool {
  id: string;
  name: string;
  description: string;
  icon: string;
  /** Shell command to check if this tool is installed (exit 0 = installed) */
  checkCommand?: string;
  /** Shell command to install this tool */
  installCommand?: string;
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
        checkCommand:
          "test -x /opt/homebrew/bin/brew || test -x /usr/local/bin/brew",
        installCommand:
          '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"',
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
        checkCommand:
          "test -x /opt/homebrew/bin/git || test -x /usr/bin/git || test -x /usr/local/bin/git",
        installCommand: "/opt/homebrew/bin/brew install git",
      },
      {
        id: "nvm",
        name: "nvm",
        description: "Node Version Manager — manage multiple Node.js versions",
        icon: "🟩",
        checkCommand: "test -d $HOME/.nvm",
        installCommand:
          '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh)"',
      },
      {
        id: "python",
        name: "Python",
        description: "General-purpose programming language",
        icon: "🐍",
        checkCommand:
          "test -x /opt/homebrew/bin/python3 || test -x /usr/bin/python3 || test -x /usr/local/bin/python3",
        installCommand: "/opt/homebrew/bin/brew install python",
      },
      {
        id: "go",
        name: "Go",
        description: "Statically typed, compiled language by Google",
        icon: "🐹",
        checkCommand:
          "test -x /opt/homebrew/bin/go || test -x /usr/local/go/bin/go",
        installCommand: "/opt/homebrew/bin/brew install go",
      },
      {
        id: "rust",
        name: "Rust",
        description: "Fast, memory-safe systems programming language",
        icon: "🦀",
        checkCommand: "test -d $HOME/.rustup",
        installCommand:
          "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y",
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
        checkCommand:
          'test -d "/Applications/iTerm.app" || test -d "$HOME/Applications/iTerm.app"',
        installCommand: "/opt/homebrew/bin/brew install --cask iterm2",
      },
      {
        id: "ohmyzsh",
        name: "Oh My Zsh",
        description: "Framework for managing Zsh configuration",
        icon: "⚡",
        checkCommand: "test -d $HOME/.oh-my-zsh",
        installCommand:
          'sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended',
      },
      {
        id: "starship",
        name: "Starship",
        description: "Minimal, fast, and customizable shell prompt",
        icon: "🚀",
        checkCommand:
          "test -x /opt/homebrew/bin/starship || test -x /usr/local/bin/starship",
        installCommand: "/opt/homebrew/bin/brew install starship",
      },
    ],
  },
];

/** Get all tools from all sections as a flat array */
export function getAllTools(sections: InstallSection[]): InstallTool[] {
  return sections.flatMap((s) => s.tools);
}

/** Starter pack bundles — arrays of tool IDs from installations.yaml */
export interface StarterPack {
  id: string;
  name: string;
  description: string;
  toolIds: string[];
}

export const STARTER_PACKS: StarterPack[] = [
  {
    id: "frontend",
    name: "Frontend Dev",
    description: "Node.js, nvm, VS Code, Git, pnpm-ready",
    toolIds: ["homebrew", "nvm", "git", "vscode"],
  },
  {
    id: "backend",
    name: "Backend Dev",
    description: "Node.js, Python, Docker, PostgreSQL, Redis",
    toolIds: ["homebrew", "nvm", "python", "docker", "postgresql", "redis"],
  },
  {
    id: "devops",
    name: "DevOps",
    description: "Docker, AWS CLI, Google Cloud, nginx",
    toolIds: ["homebrew", "docker", "aws-cli", "gcloud-cli", "nginx"],
  },
  {
    id: "mobile",
    name: "Mobile Dev",
    description: "Flutter, Android Studio, Xcode CLI tools",
    toolIds: ["homebrew", "fvm", "android-studio"],
  },
];

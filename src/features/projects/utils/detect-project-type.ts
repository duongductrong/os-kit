export type ProjectType =
  | "nodejs"
  | "rust"
  | "go"
  | "python"
  | "ruby"
  | "java"
  | "xcode"
  | "unknown";

export interface ProjectMarker {
  file: string;
  type: ProjectType;
  label: string;
}

/** Ordered list — first match wins */
export const PROJECT_MARKERS: ProjectMarker[] = [
  { file: "Cargo.toml", type: "rust", label: "Rust" },
  { file: "go.mod", type: "go", label: "Go" },
  { file: "pyproject.toml", type: "python", label: "Python" },
  { file: "requirements.txt", type: "python", label: "Python" },
  { file: "Gemfile", type: "ruby", label: "Ruby" },
  { file: "pom.xml", type: "java", label: "Java" },
  { file: "build.gradle", type: "java", label: "Java" },
  { file: "package.json", type: "nodejs", label: "Node.js" },
];

/** Map project type to a display color for the badge */
export const PROJECT_TYPE_COLORS: Record<ProjectType, string> = {
  nodejs: "bg-green-500/15 text-green-600 dark:text-green-400",
  rust: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  go: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
  python: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
  ruby: "bg-red-500/15 text-red-600 dark:text-red-400",
  java: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  xcode: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  unknown: "bg-gray-500/15 text-gray-600 dark:text-gray-400",
};

/** Map project type to a label */
export function getProjectLabel(type: ProjectType): string {
  const marker = PROJECT_MARKERS.find((m) => m.type === type);
  return marker?.label ?? "Unknown";
}

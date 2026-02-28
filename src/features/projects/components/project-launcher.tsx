import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionItem,
  SectionItemControl,
  SectionItemLabel,
  SectionTitle,
} from "@/components/ui/section";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettings } from "@/contexts/settings-context";
import { useProjectScanner } from "../hooks/use-project-scanner";
import {
  getProjectLabel,
  PROJECT_TYPE_COLORS,
} from "../utils/detect-project-type";

const IDE_OPTIONS = [
  { value: "code", label: "VS Code" },
  { value: "cursor", label: "Cursor" },
  { value: "webstorm", label: "WebStorm" },
  { value: "zed", label: "Zed" },
  { value: "fleet", label: "Fleet" },
];

export function ProjectLauncher() {
  const { settings, updateSetting } = useSettings();
  const {
    projects,
    isScanning,
    error,
    scan,
    openInIDE,
    openInTerminal,
    openInFinder,
  } = useProjectScanner();

  const [filter, setFilter] = useState("");
  const [newDir, setNewDir] = useState("");

  const filtered = filter.trim()
    ? projects.filter(
        (p) =>
          p.name.toLowerCase().includes(filter.toLowerCase()) ||
          getProjectLabel(p.type).toLowerCase().includes(filter.toLowerCase()),
      )
    : projects;

  const addScanDir = () => {
    const dir = newDir.trim();
    if (!dir || settings.scanDirectories.includes(dir)) return;
    updateSetting("scanDirectories", [...settings.scanDirectories, dir]);
    setNewDir("");
  };

  const removeScanDir = (dir: string) => {
    updateSetting(
      "scanDirectories",
      settings.scanDirectories.filter((d) => d !== dir),
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Settings */}
      <Section>
        <SectionHeader>
          <SectionTitle>Scan Settings</SectionTitle>
          <SectionDescription>
            Configure directories to scan and preferred IDE
          </SectionDescription>
        </SectionHeader>
        <SectionContent>
          <SectionItem>
            <SectionItemLabel title="Preferred IDE" />
            <SectionItemControl>
              <Select
                value={settings.preferredIDE}
                onValueChange={(v) => v && updateSetting("preferredIDE", v)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IDE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SectionItemControl>
          </SectionItem>
          <SectionItem>
            <SectionItemLabel title="Scan Depth" />
            <SectionItemControl>
              <Select
                value={String(settings.scanDepth)}
                onValueChange={(v) =>
                  v && updateSetting("scanDepth", Number(v))
                }
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                </SelectContent>
              </Select>
            </SectionItemControl>
          </SectionItem>
          {settings.scanDirectories.map((dir) => (
            <SectionItem key={dir}>
              <SectionItemLabel>
                <span className="text-sm font-mono">{dir}</span>
              </SectionItemLabel>
              <SectionItemControl>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => removeScanDir(dir)}
                >
                  Remove
                </Button>
              </SectionItemControl>
            </SectionItem>
          ))}
          <SectionItem>
            <div className="flex items-center gap-2 w-full">
              <Input
                value={newDir}
                onChange={(e) => setNewDir(e.target.value)}
                placeholder="~/path/to/dir"
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && addScanDir()}
              />
              <Button size="sm" variant="outline" onClick={addScanDir}>
                Add
              </Button>
            </div>
          </SectionItem>
        </SectionContent>
      </Section>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by name or type..."
          className="max-w-xs"
        />
        <Button size="sm" variant="outline" onClick={scan} disabled={isScanning}>
          {isScanning ? "Scanning..." : "Re-scan"}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Project list */}
      <Section>
        <SectionHeader>
          <SectionTitle>Projects</SectionTitle>
          <SectionDescription>
            {filtered.length} project(s) found
          </SectionDescription>
        </SectionHeader>
        <SectionContent>
          {filtered.length === 0 ? (
            <SectionItem>
              <p className="text-sm text-muted-foreground">
                {isScanning
                  ? "Scanning directories..."
                  : "No projects found. Check your scan directories."}
              </p>
            </SectionItem>
          ) : (
            filtered.map((project) => (
              <SectionItem key={project.path}>
                <SectionItemLabel>
                  <span className="text-sm font-medium inline-flex items-center gap-2">
                    {project.name}
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${PROJECT_TYPE_COLORS[project.type]}`}
                    >
                      {getProjectLabel(project.type)}
                    </span>
                    {project.hasVscode && (
                      <span className="text-[10px] text-muted-foreground">
                        .vscode
                      </span>
                    )}
                    {project.hasIdea && (
                      <span className="text-[10px] text-muted-foreground">
                        .idea
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono truncate max-w-[300px]">
                    {project.path}
                  </span>
                </SectionItemLabel>
                <SectionItemControl>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openInIDE(project.path)}
                  >
                    Open
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openInTerminal(project.path)}
                  >
                    Terminal
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openInFinder(project.path)}
                  >
                    Finder
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      navigator.clipboard.writeText(project.path)
                    }
                  >
                    Copy
                  </Button>
                </SectionItemControl>
              </SectionItem>
            ))
          )}
        </SectionContent>
      </Section>
    </div>
  );
}

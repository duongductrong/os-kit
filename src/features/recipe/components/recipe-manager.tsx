import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { useRecipe } from "../hooks/use-recipe";

export function RecipeManager() {
  const {
    isExporting,
    isImporting,
    importedRecipe,
    diff,
    error,
    exportRecipe,
    importRecipeFromPath,
    applyRecipe,
    clearImport,
  } = useRecipe();

  const [includeConfigs, setIncludeConfigs] = useState(false);
  const [importPath, setImportPath] = useState("");

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Export */}
      <Section>
        <SectionHeader>
          <SectionTitle>Export Recipe</SectionTitle>
          <SectionDescription>
            Save your current tool setup as a shareable YAML file
          </SectionDescription>
        </SectionHeader>
        <SectionContent>
          <SectionItem>
            <SectionItemLabel
              title="Include config files"
              description="Export .gitconfig content (may contain sensitive data)"
            />
            <SectionItemControl>
              <Switch
                checked={includeConfigs}
                onCheckedChange={setIncludeConfigs}
              />
            </SectionItemControl>
          </SectionItem>
          <SectionItem>
            <SectionItemLabel
              title="Export to file"
              description="Scans installed tools and saves to YAML"
            />
            <SectionItemControl>
              <Button
                size="sm"
                variant="outline"
                onClick={() => exportRecipe(includeConfigs)}
                disabled={isExporting}
              >
                {isExporting ? "Exporting..." : "Export"}
              </Button>
            </SectionItemControl>
          </SectionItem>
        </SectionContent>
      </Section>

      {/* Import */}
      <Section>
        <SectionHeader>
          <SectionTitle>Import Recipe</SectionTitle>
          <SectionDescription>
            Load a recipe file and install missing tools
          </SectionDescription>
        </SectionHeader>
        <SectionContent>
          {!importedRecipe ? (
            <SectionItem>
              <SectionItemLabel
                title="Recipe file path"
                description="Enter the path to your .yaml recipe file"
              />
              <SectionItemControl>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={importPath}
                    onChange={(e) => setImportPath(e.target.value)}
                    placeholder="~/Desktop/oskit-recipe.yaml"
                    className="text-sm border rounded px-2 py-1 w-56 bg-background"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && importPath.trim()) {
                        importRecipeFromPath(importPath.trim());
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => importRecipeFromPath(importPath.trim())}
                    disabled={!importPath.trim()}
                  >
                    Import
                  </Button>
                </div>
              </SectionItemControl>
            </SectionItem>
          ) : (
            <>
              {/* Diff view */}
              {diff.map((item) => (
                <SectionItem key={item.toolId}>
                  <SectionItemLabel>
                    <span className="text-sm font-medium">{item.toolName}</span>
                  </SectionItemLabel>
                  <SectionItemControl>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        item.status === "installed"
                          ? "bg-green-500/15 text-green-600 dark:text-green-400"
                          : item.status === "will_install"
                            ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {item.status === "installed"
                        ? "Already installed"
                        : item.status === "will_install"
                          ? "Will install"
                          : "Not available"}
                    </span>
                  </SectionItemControl>
                </SectionItem>
              ))}
              <SectionItem>
                <div className="flex items-center gap-2 w-full justify-end">
                  <Button size="sm" variant="ghost" onClick={clearImport}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={applyRecipe}
                    disabled={isImporting || diff.filter((d) => d.status === "will_install").length === 0}
                  >
                    {isImporting
                      ? "Applying..."
                      : `Apply (${diff.filter((d) => d.status === "will_install").length} to install)`}
                  </Button>
                </div>
              </SectionItem>
            </>
          )}
        </SectionContent>
      </Section>
    </div>
  );
}

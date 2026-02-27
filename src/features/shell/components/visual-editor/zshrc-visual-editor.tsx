import { useMemo } from "react";
import type { ZshrcParsed } from "@/features/shell/utils/parse-zshrc";
import { parseZshrc, buildZshrc } from "@/features/shell/utils/parse-zshrc";
import { EnvVarsSection } from "@/features/shell/components/visual-editor/env-vars-section";
import { AliasesSection } from "@/features/shell/components/visual-editor/aliases-section";
import { PathEntriesSection } from "@/features/shell/components/visual-editor/path-entries-section";
import { SourcesSection } from "@/features/shell/components/visual-editor/sources-section";

interface ZshrcVisualEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export function ZshrcVisualEditor({
  content,
  onChange,
}: ZshrcVisualEditorProps) {
  const parsed = useMemo(() => parseZshrc(content), [content]);

  const updateAndRebuild = (partial: Partial<ZshrcParsed>) => {
    const updated: ZshrcParsed = { ...parsed, ...partial };
    onChange(buildZshrc(updated));
  };

  return (
    <div className="flex flex-col gap-6">
      <EnvVarsSection
        items={parsed.envVars}
        onChange={(envVars) => updateAndRebuild({ envVars })}
      />
      <PathEntriesSection
        items={parsed.pathEntries}
        onChange={(pathEntries) => updateAndRebuild({ pathEntries })}
      />
      <AliasesSection
        items={parsed.aliases}
        onChange={(aliases) => updateAndRebuild({ aliases })}
      />
      <SourcesSection
        items={parsed.sources}
        onChange={(sources) => updateAndRebuild({ sources })}
      />

      {/* Unrecognized lines info */}
      {parsed.otherLines.filter((l) => l.trim() !== "").length > 0 && (
        <p className="text-xs text-muted-foreground px-1">
          {parsed.otherLines.filter((l) => l.trim() !== "" && !l.trim().startsWith("#")).length}{" "}
          unrecognized line(s) preserved. Switch to Raw mode to view them.
        </p>
      )}
    </div>
  );
}

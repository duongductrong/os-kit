import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useZshrcEditor } from "@/features/shell/hooks/use-zshrc-editor";
import { ZshrcVisualEditor } from "@/features/shell/components/visual-editor/zshrc-visual-editor";
import {
  Alert02Icon,
  CodeIcon,
  DashboardSquare01Icon,
  FileEditIcon,
  FloppyDiskIcon,
  Loading03Icon,
  ReloadIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

type EditorMode = "visual" | "raw";

export function ZshrcEditor() {
  const [mode, setMode] = useState<EditorMode>("visual");
  const {
    content,
    isLoading,
    isSaving,
    error,
    isDirty,
    load,
    save,
    setContent,
  } = useZshrcEditor();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <HugeiconsIcon
          icon={Loading03Icon}
          strokeWidth={2}
          className="size-5 animate-spin text-muted-foreground"
        />
        <p className="text-sm text-muted-foreground">Loading ~/.zshrc...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Warning Banner */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
        <HugeiconsIcon
          icon={Alert02Icon}
          strokeWidth={2}
          className="mt-0.5 size-4 shrink-0 text-amber-500"
        />
        <p className="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
          Changes to <code className="font-mono font-semibold">~/.zshrc</code>{" "}
          affect your shell environment. A backup will be created at{" "}
          <code className="font-mono font-semibold">~/.zshrc.backup</code>{" "}
          before each save.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
          <HugeiconsIcon
            icon={Alert02Icon}
            strokeWidth={2}
            className="mt-0.5 size-4 shrink-0 text-destructive"
          />
          <p className="text-xs text-destructive leading-relaxed">{error}</p>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={FileEditIcon}
            strokeWidth={2}
            className="size-4 text-muted-foreground"
          />
          <span className="text-sm font-medium text-muted-foreground font-mono">
            ~/.zshrc
          </span>
          {isDirty && (
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
              Unsaved
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Toggle */}
          <div className="flex items-center rounded-lg border p-0.5">
            <button
              onClick={() => setMode("visual")}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                mode === "visual"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <HugeiconsIcon
                icon={DashboardSquare01Icon}
                strokeWidth={2}
                className="size-3"
              />
              Visual
            </button>
            <button
              onClick={() => setMode("raw")}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                mode === "raw"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <HugeiconsIcon
                icon={CodeIcon}
                strokeWidth={2}
                className="size-3"
              />
              Raw
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={load}
            disabled={isSaving}
          >
            <HugeiconsIcon
              icon={ReloadIcon}
              strokeWidth={2}
              className="size-3.5"
            />
            Reload
          </Button>
          <Button size="sm" onClick={save} disabled={!isDirty || isSaving}>
            {isSaving ? (
              <HugeiconsIcon
                icon={Loading03Icon}
                strokeWidth={2}
                className="size-3.5 animate-spin"
              />
            ) : (
              <HugeiconsIcon
                icon={FloppyDiskIcon}
                strokeWidth={2}
                className="size-3.5"
              />
            )}
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      {mode === "visual" ? (
        <ZshrcVisualEditor content={content} onChange={setContent} />
      ) : (
        <div className="relative rounded-lg border overflow-hidden">
          <div className="flex max-h-[60vh]">
            {/* Line Numbers */}
            <div
              className="select-none border-r bg-muted/30 px-3 py-3 text-right font-mono text-xs text-muted-foreground/50 leading-[1.625rem]"
              aria-hidden="true"
            >
              {content.split("\n").map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Textarea */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              spellCheck={false}
              className="flex-1 resize-none bg-transparent px-4 py-3 font-mono text-sm leading-[1.625rem] outline-none placeholder:text-muted-foreground/40 min-h-[400px] w-full"
              placeholder="# Your zshrc configuration..."
            />
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{content.split("\n").length} lines</span>
        {!isDirty && !isSaving && (
          <span className="flex items-center gap-1">
            <HugeiconsIcon
              icon={Tick02Icon}
              strokeWidth={2}
              className="size-3 text-emerald-500"
            />
            Up to date
          </span>
        )}
      </div>
    </div>
  );
}

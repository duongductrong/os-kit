import { Command } from "@tauri-apps/plugin-shell";
import { useCallback, useEffect, useRef, useState } from "react";

export interface UseZshrcEditorReturn {
  content: string;
  originalContent: string;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  isDirty: boolean;
  load: () => Promise<void>;
  save: () => Promise<void>;
  setContent: (content: string) => void;
}

async function runShellCommand(cmd: string): Promise<string> {
  const command = Command.create("exec-sh", ["-c", cmd]);
  const output = await command.execute();
  if (output.code !== 0) {
    throw new Error(output.stderr || `Command failed with code ${output.code}`);
  }
  return output.stdout;
}

export function useZshrcEditor(): UseZshrcEditorReturn {
  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const isDirty = content !== originalContent;

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Ensure the file exists; create it if it doesn't
      await runShellCommand("touch ~/.zshrc");
      const result = await runShellCommand("cat ~/.zshrc");
      if (mountedRef.current) {
        setContent(result);
        setOriginalContent(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(
          err instanceof Error ? err.message : "Failed to read ~/.zshrc",
        );
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const save = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    try {
      // Create a backup first
      await runShellCommand("cp ~/.zshrc ~/.zshrc.backup 2>/dev/null || true");

      // Base64-encode in JS to avoid all shell escaping issues,
      // then decode on the shell side and write to file
      const encoder = new TextEncoder();
      const bytes = encoder.encode(content);
      const base64 = btoa(String.fromCharCode(...bytes));

      await runShellCommand(`echo '${base64}' | base64 -d > ~/.zshrc`);

      if (mountedRef.current) {
        setOriginalContent(content);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(
          err instanceof Error ? err.message : "Failed to save ~/.zshrc",
        );
      }
    } finally {
      if (mountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [content]);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  return {
    content,
    originalContent,
    isLoading,
    isSaving,
    error,
    isDirty,
    load,
    save,
    setContent,
  };
}

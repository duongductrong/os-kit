import { Command } from "@tauri-apps/plugin-shell";
import { useCallback, useEffect, useRef, useState } from "react";

export interface UseZshrcEditorReturn {
  content: string;
  originalContent: string;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  isDirty: boolean;
  hasBackup: boolean;
  backupTimestamp: string | null;
  load: () => Promise<void>;
  save: () => Promise<void>;
  backup: () => Promise<void>;
  restoreBackup: () => Promise<void>;
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
  const [hasBackup, setHasBackup] = useState(false);
  const [backupTimestamp, setBackupTimestamp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const isDirty = content !== originalContent;

  const checkBackup = useCallback(async () => {
    try {
      // Get modification time of backup file
      const timestamp = await runShellCommand(
        "stat -f '%Sm' -t '%Y-%m-%d %H:%M:%S' ~/.zshrc.backup 2>/dev/null"
      );
      if (mountedRef.current) {
        setHasBackup(true);
        setBackupTimestamp(timestamp.trim());
      }
    } catch {
      if (mountedRef.current) {
        setHasBackup(false);
        setBackupTimestamp(null);
      }
    }
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await runShellCommand("touch ~/.zshrc");
      const result = await runShellCommand("cat ~/.zshrc");
      if (mountedRef.current) {
        setContent(result);
        setOriginalContent(result);
      }
      await checkBackup();
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
  }, [checkBackup]);

  const save = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    try {
      await runShellCommand("cp ~/.zshrc ~/.zshrc.backup 2>/dev/null || true");

      const encoder = new TextEncoder();
      const bytes = encoder.encode(content);
      const base64 = btoa(String.fromCharCode(...bytes));

      await runShellCommand(`echo '${base64}' | base64 -d > ~/.zshrc`);

      if (mountedRef.current) {
        setOriginalContent(content);
        setHasBackup(true);
      }
      await checkBackup();
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
  }, [content, checkBackup]);

  const backup = useCallback(async () => {
    setError(null);
    try {
      await runShellCommand("cp ~/.zshrc ~/.zshrc.backup");
      await checkBackup();
    } catch (err) {
      if (mountedRef.current) {
        setError(
          err instanceof Error ? err.message : "Failed to create backup",
        );
      }
    }
  }, [checkBackup]);

  const restoreBackup = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await runShellCommand("cp ~/.zshrc.backup ~/.zshrc");
      const result = await runShellCommand("cat ~/.zshrc");
      if (mountedRef.current) {
        setContent(result);
        setOriginalContent(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(
          err instanceof Error ? err.message : "Failed to restore backup",
        );
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

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
    hasBackup,
    backupTimestamp,
    load,
    save,
    backup,
    restoreBackup,
    setContent,
  };
}

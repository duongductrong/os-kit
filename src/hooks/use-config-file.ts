import { Command } from "@tauri-apps/plugin-shell";
import { useCallback, useEffect, useRef, useState } from "react";

/** Run a shell command, throw on non-zero exit */
async function runSh(cmd: string): Promise<string> {
  const output = await Command.create("exec-sh", ["-c", cmd]).execute();
  if (output.code !== 0) {
    throw new Error(output.stderr || `Command failed with code ${output.code}`);
  }
  return output.stdout;
}

export interface ConfigFileOptions {
  /** Absolute path to the config file (e.g. ~/.gitconfig) */
  path: string;
  /** If true, writes use osascript sudo elevation (for /etc/hosts) */
  sudo?: boolean;
  /** If true, touch the file before reading (create if missing) */
  createIfMissing?: boolean;
}

export interface ConfigFileState {
  content: string;
  originalContent: string;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  isDirty: boolean;
  hasBackup: boolean;
  backupTimestamp: string | null;
  load: () => Promise<void>;
  save: (newContent?: string) => Promise<void>;
  backup: () => Promise<void>;
  restoreBackup: () => Promise<void>;
  setContent: (content: string) => void;
}

/**
 * Generic hook for reading, writing, backing up, and restoring config files.
 * Extracted from use-zshrc-editor.ts to be reused across all config editors.
 */
export function useConfigFile(options: ConfigFileOptions): ConfigFileState {
  const { path, sudo = false, createIfMissing = false } = options;
  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasBackup, setHasBackup] = useState(false);
  const [backupTimestamp, setBackupTimestamp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const isDirty = content !== originalContent;
  const backupPath = `${path}.backup`;

  const checkBackup = useCallback(async () => {
    try {
      const ts = await runSh(
        `stat -f '%Sm' -t '%Y-%m-%d %H:%M:%S' ${backupPath} 2>/dev/null`,
      );
      if (mountedRef.current) {
        setHasBackup(true);
        setBackupTimestamp(ts.trim());
      }
    } catch {
      if (mountedRef.current) {
        setHasBackup(false);
        setBackupTimestamp(null);
      }
    }
  }, [backupPath]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (createIfMissing) {
        await runSh(`touch ${path}`);
      }
      const result = await runSh(`cat ${path}`);
      if (mountedRef.current) {
        setContent(result);
        setOriginalContent(result);
      }
      await checkBackup();
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : `Failed to read ${path}`);
      }
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [path, createIfMissing, checkBackup]);

  const save = useCallback(
    async (newContent?: string) => {
      const toSave = newContent ?? content;
      setIsSaving(true);
      setError(null);
      try {
        // Backup before save
        await runSh(`cp ${path} ${backupPath} 2>/dev/null || true`);

        const encoder = new TextEncoder();
        const bytes = encoder.encode(toSave);
        const base64 = btoa(String.fromCharCode(...bytes));

        if (sudo) {
          // Use osascript for sudo elevation on macOS
          await runSh(
            `echo '${base64}' | base64 -d | osascript -e 'do shell script "cat > ${path}" with administrator privileges'`,
          );
        } else {
          await runSh(`echo '${base64}' | base64 -d > ${path}`);
        }

        if (mountedRef.current) {
          setContent(toSave);
          setOriginalContent(toSave);
          setHasBackup(true);
        }
        await checkBackup();
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : `Failed to save ${path}`);
        }
      } finally {
        if (mountedRef.current) setIsSaving(false);
      }
    },
    [content, path, backupPath, sudo, checkBackup],
  );

  const backup = useCallback(async () => {
    setError(null);
    try {
      await runSh(`cp ${path} ${backupPath}`);
      await checkBackup();
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to create backup");
      }
    }
  }, [path, backupPath, checkBackup]);

  const restoreBackup = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await runSh(`cp ${backupPath} ${path}`);
      const result = await runSh(`cat ${path}`);
      if (mountedRef.current) {
        setContent(result);
        setOriginalContent(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to restore backup");
      }
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [path, backupPath]);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => { mountedRef.current = false; };
  }, [load]);

  return {
    content, originalContent, isLoading, isSaving, error, isDirty,
    hasBackup, backupTimestamp, load, save, backup, restoreBackup, setContent,
  };
}

import { Command } from "@tauri-apps/plugin-shell";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useConfigFile } from "@/hooks/use-config-file";
import {
  parseSshConfig,
  buildSshConfig,
  type SshKey,
  type SshHostBlock,
} from "../utils/parse-ssh-config";

async function runSh(cmd: string): Promise<string> {
  const output = await Command.create("exec-sh", ["-c", cmd]).execute();
  if (output.code !== 0) throw new Error(output.stderr || `Failed: ${cmd}`);
  return output.stdout;
}

export function useSshManager() {
  // SSH config file state
  const configFile = useConfigFile({
    path: "~/.ssh/config",
    createIfMissing: true,
  });

  const hostBlocks = useMemo(
    () => parseSshConfig(configFile.content),
    [configFile.content],
  );

  const updateBlocks = useCallback(
    (blocks: SshHostBlock[]) => {
      configFile.setContent(buildSshConfig(blocks));
    },
    [configFile],
  );

  const addHostBlock = useCallback(
    (block: SshHostBlock) => {
      updateBlocks([...hostBlocks, block]);
    },
    [hostBlocks, updateBlocks],
  );

  const removeHostBlock = useCallback(
    (host: string) => {
      updateBlocks(hostBlocks.filter((b) => b.host !== host));
    },
    [hostBlocks, updateBlocks],
  );

  const updateHostBlock = useCallback(
    (oldHost: string, updated: SshHostBlock) => {
      updateBlocks(
        hostBlocks.map((b) => (b.host === oldHost ? updated : b)),
      );
    },
    [hostBlocks, updateBlocks],
  );

  // SSH keys list
  const [keys, setKeys] = useState<SshKey[]>([]);
  const [isKeysLoading, setIsKeysLoading] = useState(true);

  const scanKeys = useCallback(async () => {
    setIsKeysLoading(true);
    try {
      const pubFiles = await runSh(
        "ls ~/.ssh/*.pub 2>/dev/null || echo ''",
      );
      const files = pubFiles.trim().split("\n").filter(Boolean);
      const scannedKeys: SshKey[] = [];

      for (const file of files) {
        try {
          const pubContent = (await runSh(`cat ${file}`)).trim();
          const parts = pubContent.split(" ");
          const type = parts[0] ?? "unknown";
          const comment = parts.slice(2).join(" ") || file.replace(/.*\//, "").replace(".pub", "");

          let fingerprint = "";
          try {
            fingerprint = (await runSh(`ssh-keygen -lf ${file} 2>/dev/null`)).trim().split(" ")[1] ?? "";
          } catch { /* skip */ }

          scannedKeys.push({
            filename: file.replace(/.*\//, "").replace(".pub", ""),
            type,
            fingerprint,
            comment,
            publicKey: pubContent,
          });
        } catch { /* skip individual key errors */ }
      }

      setKeys(scannedKeys);
    } catch {
      setKeys([]);
    } finally {
      setIsKeysLoading(false);
    }
  }, []);

  useEffect(() => { scanKeys(); }, [scanKeys]);

  const generateKey = useCallback(
    async (opts: { type: string; filename: string; comment: string; passphrase: string }) => {
      const path = `~/.ssh/${opts.filename}`;
      const cmd = opts.passphrase
        ? `ssh-keygen -t ${opts.type} -C "${opts.comment}" -f ${path} -N "${opts.passphrase}"`
        : `ssh-keygen -t ${opts.type} -C "${opts.comment}" -f ${path} -N ""`;
      await runSh(cmd);
      await scanKeys();
    },
    [scanKeys],
  );

  const deleteKey = useCallback(
    async (filename: string) => {
      await runSh(`rm -f ~/.ssh/${filename} ~/.ssh/${filename}.pub`);
      await scanKeys();
    },
    [scanKeys],
  );

  const copyPublicKey = useCallback(async (filename: string) => {
    const content = await runSh(`cat ~/.ssh/${filename}.pub`);
    await navigator.clipboard.writeText(content.trim());
  }, []);

  return {
    // Config file
    configFile,
    hostBlocks,
    addHostBlock,
    removeHostBlock,
    updateHostBlock,
    // Keys
    keys,
    isKeysLoading,
    scanKeys,
    generateKey,
    deleteKey,
    copyPublicKey,
  };
}

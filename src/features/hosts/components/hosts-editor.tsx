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
import { Switch } from "@/components/ui/switch";
import { useHostsFile } from "../hooks/use-hosts-file";

export function HostsEditor() {
  const {
    isLoading, isSaving, error, isDirty,
    hasBackup, backupTimestamp,
    save, backup, restoreBackup,
    systemEntries, userEntries,
    toggleEntry, addEntry, removeEntry,
  } = useHostsFile();

  const [newIp, setNewIp] = useState("");
  const [newHostname, setNewHostname] = useState("");
  const [newComment, setNewComment] = useState("");

  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Loading /etc/hosts...</p>;
  }

  const handleAdd = () => {
    if (newIp.trim() && newHostname.trim()) {
      addEntry(newIp.trim(), newHostname.trim(), newComment.trim() || undefined);
      setNewIp("");
      setNewHostname("");
      setNewComment("");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Warning banner */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
        Editing the hosts file requires admin password. You'll be prompted when saving.
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {hasBackup && (
            <span className="text-xs text-muted-foreground">Backup: {backupTimestamp}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="outline" onClick={backup} disabled={isSaving}>Backup</Button>
          <Button size="sm" variant="outline" onClick={restoreBackup} disabled={!hasBackup || isSaving}>Restore</Button>
          <Button size="sm" onClick={() => save()} disabled={!isDirty || isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* System Entries */}
      <Section>
        <SectionHeader>
          <SectionTitle>System Entries</SectionTitle>
          <SectionDescription>Core system host mappings (edit with caution)</SectionDescription>
        </SectionHeader>
        <SectionContent>
          {systemEntries.map((entry) => (
            <SectionItem key={entry.lineIndex}>
              <SectionItemLabel>
                <span className="text-sm font-medium inline-flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground w-28">{entry.ip}</span>
                  {entry.hostname}
                </span>
              </SectionItemLabel>
              <SectionItemControl>
                <Switch
                  checked={entry.enabled}
                  onCheckedChange={() => toggleEntry(entry.lineIndex)}
                />
              </SectionItemControl>
            </SectionItem>
          ))}
        </SectionContent>
      </Section>

      {/* User Entries */}
      <Section>
        <SectionHeader>
          <SectionTitle>User Entries</SectionTitle>
          <SectionDescription>Custom host mappings</SectionDescription>
        </SectionHeader>
        <SectionContent>
          {userEntries.length === 0 && (
            <SectionItem>
              <p className="text-sm text-muted-foreground">No custom host entries</p>
            </SectionItem>
          )}
          {userEntries.map((entry) => (
            <SectionItem key={entry.lineIndex}>
              <SectionItemLabel>
                <span className="text-sm font-medium inline-flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground w-28">{entry.ip}</span>
                  {entry.hostname}
                  {entry.comment && (
                    <span className="text-xs text-muted-foreground">({entry.comment})</span>
                  )}
                </span>
              </SectionItemLabel>
              <SectionItemControl>
                <Switch
                  checked={entry.enabled}
                  onCheckedChange={() => toggleEntry(entry.lineIndex)}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => removeEntry(entry.lineIndex)}
                >
                  Remove
                </Button>
              </SectionItemControl>
            </SectionItem>
          ))}

          {/* Add new entry row */}
          <SectionItem>
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={newIp}
                onChange={(e) => setNewIp(e.target.value)}
                placeholder="127.0.0.1"
                className="w-28 font-mono"
              />
              <Input
                value={newHostname}
                onChange={(e) => setNewHostname(e.target.value)}
                placeholder="myapp.local"
                className="flex-1"
              />
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Comment (optional)"
                className="w-36"
              />
            </div>
            <SectionItemControl>
              <Button size="sm" variant="outline" onClick={handleAdd}>Add</Button>
            </SectionItemControl>
          </SectionItem>
        </SectionContent>
      </Section>
    </div>
  );
}

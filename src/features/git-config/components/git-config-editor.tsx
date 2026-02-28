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
import { useGitConfig } from "../hooks/use-git-config";

export function GitConfigEditor() {
  const {
    isLoading, isSaving, error, isDirty,
    hasBackup, backupTimestamp,
    save, backup, restoreBackup,
    getValue, setValue,
    aliases, addAlias, removeAlias,
  } = useGitConfig();

  const [newAliasName, setNewAliasName] = useState("");
  const [newAliasCmd, setNewAliasCmd] = useState("");

  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Loading ~/.gitconfig...</p>;
  }

  const handleAddAlias = () => {
    if (newAliasName.trim() && newAliasCmd.trim()) {
      addAlias(newAliasName.trim(), newAliasCmd.trim());
      setNewAliasName("");
      setNewAliasCmd("");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {hasBackup && (
            <span className="text-xs text-muted-foreground">
              Backup: {backupTimestamp}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="outline" onClick={backup} disabled={isSaving}>
            Backup
          </Button>
          <Button size="sm" variant="outline" onClick={restoreBackup} disabled={!hasBackup || isSaving}>
            Restore
          </Button>
          <Button size="sm" onClick={() => save()} disabled={!isDirty || isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* User Section */}
      <Section>
        <SectionHeader>
          <SectionTitle>User</SectionTitle>
          <SectionDescription>Your Git identity</SectionDescription>
        </SectionHeader>
        <SectionContent>
          <SectionItem>
            <SectionItemLabel title="Name" description="user.name" />
            <SectionItemControl>
              <Input
                value={getValue("user.name")}
                onChange={(e) => setValue("user.name", e.target.value)}
                className="w-48"
                placeholder="Your Name"
              />
            </SectionItemControl>
          </SectionItem>
          <SectionItem>
            <SectionItemLabel title="Email" description="user.email" />
            <SectionItemControl>
              <Input
                value={getValue("user.email")}
                onChange={(e) => setValue("user.email", e.target.value)}
                className="w-48"
                placeholder="you@example.com"
              />
            </SectionItemControl>
          </SectionItem>
        </SectionContent>
      </Section>

      {/* Core Section */}
      <Section>
        <SectionHeader>
          <SectionTitle>Core</SectionTitle>
        </SectionHeader>
        <SectionContent>
          <SectionItem>
            <SectionItemLabel title="Default Editor" description="core.editor" />
            <SectionItemControl>
              <Input
                value={getValue("core.editor")}
                onChange={(e) => setValue("core.editor", e.target.value)}
                className="w-48"
                placeholder="vim"
              />
            </SectionItemControl>
          </SectionItem>
          <SectionItem>
            <SectionItemLabel title="Auto CRLF" description="core.autocrlf" />
            <SectionItemControl>
              <Input
                value={getValue("core.autocrlf")}
                onChange={(e) => setValue("core.autocrlf", e.target.value)}
                className="w-24"
                placeholder="input"
              />
            </SectionItemControl>
          </SectionItem>
        </SectionContent>
      </Section>

      {/* Pull/Push Section */}
      <Section>
        <SectionHeader>
          <SectionTitle>Pull / Push</SectionTitle>
        </SectionHeader>
        <SectionContent>
          <SectionItem>
            <SectionItemLabel title="Pull Rebase" description="pull.rebase" />
            <SectionItemControl>
              <Switch
                checked={getValue("pull.rebase") === "true"}
                onCheckedChange={(v) => setValue("pull.rebase", v ? "true" : "false")}
              />
            </SectionItemControl>
          </SectionItem>
          <SectionItem>
            <SectionItemLabel title="Auto Setup Remote" description="push.autoSetupRemote" />
            <SectionItemControl>
              <Switch
                checked={getValue("push.autoSetupRemote") === "true"}
                onCheckedChange={(v) => setValue("push.autoSetupRemote", v ? "true" : "false")}
              />
            </SectionItemControl>
          </SectionItem>
          <SectionItem>
            <SectionItemLabel title="Push Default" description="push.default" />
            <SectionItemControl>
              <Input
                value={getValue("push.default")}
                onChange={(e) => setValue("push.default", e.target.value)}
                className="w-32"
                placeholder="current"
              />
            </SectionItemControl>
          </SectionItem>
        </SectionContent>
      </Section>

      {/* GPG Section */}
      <Section>
        <SectionHeader>
          <SectionTitle>GPG Signing</SectionTitle>
        </SectionHeader>
        <SectionContent>
          <SectionItem>
            <SectionItemLabel title="Sign Commits" description="commit.gpgsign" />
            <SectionItemControl>
              <Switch
                checked={getValue("commit.gpgsign") === "true"}
                onCheckedChange={(v) => setValue("commit.gpgsign", v ? "true" : "false")}
              />
            </SectionItemControl>
          </SectionItem>
          <SectionItem>
            <SectionItemLabel title="Signing Key" description="user.signingkey" />
            <SectionItemControl>
              <Input
                value={getValue("user.signingkey")}
                onChange={(e) => setValue("user.signingkey", e.target.value)}
                className="w-48"
                placeholder="Key ID"
              />
            </SectionItemControl>
          </SectionItem>
        </SectionContent>
      </Section>

      {/* Aliases Section */}
      <Section>
        <SectionHeader>
          <SectionTitle>Aliases</SectionTitle>
          <SectionDescription>Git command shortcuts</SectionDescription>
        </SectionHeader>
        <SectionContent>
          {aliases.map((alias) => (
            <SectionItem key={alias.key}>
              <SectionItemLabel title={alias.key} description={alias.value} />
              <SectionItemControl>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => removeAlias(alias.key)}
                >
                  Remove
                </Button>
              </SectionItemControl>
            </SectionItem>
          ))}
          <SectionItem>
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={newAliasName}
                onChange={(e) => setNewAliasName(e.target.value)}
                placeholder="Alias name"
                className="w-28"
              />
              <Input
                value={newAliasCmd}
                onChange={(e) => setNewAliasCmd(e.target.value)}
                placeholder="Git command"
                className="flex-1"
              />
            </div>
            <SectionItemControl>
              <Button size="sm" variant="outline" onClick={handleAddAlias}>
                Add
              </Button>
            </SectionItemControl>
          </SectionItem>
        </SectionContent>
      </Section>
    </div>
  );
}

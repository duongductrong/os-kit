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
import { useSshManager } from "../hooks/use-ssh-manager";
import type { SshHostBlock } from "../utils/parse-ssh-config";

export function SshManager() {
  const {
    configFile,
    hostBlocks,
    addHostBlock,
    removeHostBlock,
    keys,
    isKeysLoading,
    generateKey,
    deleteKey,
    copyPublicKey,
  } = useSshManager();

  const [tab, setTab] = useState<"keys" | "config">("keys");
  const [showGenerate, setShowGenerate] = useState(false);
  const [genType, setGenType] = useState("ed25519");
  const [genFilename, setGenFilename] = useState("id_ed25519");
  const [genComment, setGenComment] = useState("");
  const [genPassphrase, setGenPassphrase] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // New host block state
  const [showAddHost, setShowAddHost] = useState(false);
  const [newHost, setNewHost] = useState("");
  const [newHostname, setNewHostname] = useState("");
  const [newUser, setNewUser] = useState("");
  const [newIdentityFile, setNewIdentityFile] = useState("");

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generateKey({
        type: genType,
        filename: genFilename,
        comment: genComment,
        passphrase: genPassphrase,
      });
      setShowGenerate(false);
      setGenFilename("id_ed25519");
      setGenComment("");
      setGenPassphrase("");
    } catch (err) {
      console.error("Key generation failed:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddHost = () => {
    if (!newHost.trim()) return;
    const block: SshHostBlock = {
      host: newHost.trim(),
      hostname: newHostname.trim() || undefined,
      user: newUser.trim() || undefined,
      identityFile: newIdentityFile.trim() || undefined,
      extras: [],
    };
    addHostBlock(block);
    setShowAddHost(false);
    setNewHost("");
    setNewHostname("");
    setNewUser("");
    setNewIdentityFile("");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Tab switcher */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          className={`text-sm px-3 py-1.5 rounded-md ${tab === "keys" ? "bg-muted font-medium" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => setTab("keys")}
        >
          SSH Keys
        </button>
        <button
          className={`text-sm px-3 py-1.5 rounded-md ${tab === "config" ? "bg-muted font-medium" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => setTab("config")}
        >
          SSH Config
        </button>
      </div>

      {/* Keys Tab */}
      {tab === "keys" && (
        <>
          <Section>
            <SectionHeader>
              <div className="flex items-center justify-between">
                <div>
                  <SectionTitle>SSH Keys</SectionTitle>
                  <SectionDescription>Manage your SSH key pairs</SectionDescription>
                </div>
                <Button size="sm" onClick={() => setShowGenerate(!showGenerate)}>
                  {showGenerate ? "Cancel" : "Generate Key"}
                </Button>
              </div>
            </SectionHeader>

            {/* Key generation form */}
            {showGenerate && (
              <SectionContent>
                <SectionItem>
                  <SectionItemLabel title="Key Type" />
                  <SectionItemControl>
                    <Select value={genType} onValueChange={(v) => v && setGenType(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ed25519">Ed25519 (recommended)</SelectItem>
                        <SelectItem value="rsa">RSA (4096-bit)</SelectItem>
                      </SelectContent>
                    </Select>
                  </SectionItemControl>
                </SectionItem>
                <SectionItem>
                  <SectionItemLabel title="Filename" />
                  <SectionItemControl>
                    <Input value={genFilename} onChange={(e) => setGenFilename(e.target.value)} className="w-40" />
                  </SectionItemControl>
                </SectionItem>
                <SectionItem>
                  <SectionItemLabel title="Comment" />
                  <SectionItemControl>
                    <Input value={genComment} onChange={(e) => setGenComment(e.target.value)} className="w-48" placeholder="you@example.com" />
                  </SectionItemControl>
                </SectionItem>
                <SectionItem>
                  <SectionItemLabel title="Passphrase" description="Optional" />
                  <SectionItemControl>
                    <Input type="password" value={genPassphrase} onChange={(e) => setGenPassphrase(e.target.value)} className="w-40" />
                  </SectionItemControl>
                </SectionItem>
                <SectionItem>
                  <div />
                  <SectionItemControl>
                    <Button size="sm" onClick={handleGenerate} disabled={isGenerating || !genFilename.trim()}>
                      {isGenerating ? "Generating..." : "Generate"}
                    </Button>
                  </SectionItemControl>
                </SectionItem>
              </SectionContent>
            )}

            {/* Keys list */}
            <SectionContent>
              {isKeysLoading ? (
                <SectionItem><p className="text-sm text-muted-foreground">Scanning keys...</p></SectionItem>
              ) : keys.length === 0 ? (
                <SectionItem><p className="text-sm text-muted-foreground">No SSH keys found in ~/.ssh/</p></SectionItem>
              ) : (
                keys.map((key) => (
                  <SectionItem key={key.filename}>
                    <SectionItemLabel>
                      <span className="text-sm font-medium inline-flex items-center gap-2">
                        {key.filename}
                        <span className="font-mono text-xs text-muted-foreground">{key.type}</span>
                      </span>
                      <span className="text-xs text-muted-foreground font-mono truncate max-w-xs block">
                        {key.fingerprint}
                      </span>
                    </SectionItemLabel>
                    <SectionItemControl>
                      <Button size="sm" variant="outline" onClick={() => copyPublicKey(key.filename)}>
                        Copy
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteKey(key.filename)}>
                        Delete
                      </Button>
                    </SectionItemControl>
                  </SectionItem>
                ))
              )}
            </SectionContent>
          </Section>
        </>
      )}

      {/* Config Tab */}
      {tab === "config" && (
        <Section>
          <SectionHeader>
            <div className="flex items-center justify-between">
              <div>
                <SectionTitle>SSH Config</SectionTitle>
                <SectionDescription>Edit ~/.ssh/config host entries</SectionDescription>
              </div>
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="outline" onClick={() => setShowAddHost(!showAddHost)}>
                  {showAddHost ? "Cancel" : "Add Host"}
                </Button>
                <Button size="sm" onClick={() => configFile.save()} disabled={!configFile.isDirty || configFile.isSaving}>
                  {configFile.isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </SectionHeader>

          {configFile.error && <p className="text-sm text-destructive">{configFile.error}</p>}

          {/* Add host form */}
          {showAddHost && (
            <SectionContent>
              <SectionItem>
                <SectionItemLabel title="Host" description="Alias name" />
                <SectionItemControl>
                  <Input value={newHost} onChange={(e) => setNewHost(e.target.value)} className="w-36" placeholder="myserver" />
                </SectionItemControl>
              </SectionItem>
              <SectionItem>
                <SectionItemLabel title="HostName" description="IP or domain" />
                <SectionItemControl>
                  <Input value={newHostname} onChange={(e) => setNewHostname(e.target.value)} className="w-40" placeholder="192.168.1.1" />
                </SectionItemControl>
              </SectionItem>
              <SectionItem>
                <SectionItemLabel title="User" />
                <SectionItemControl>
                  <Input value={newUser} onChange={(e) => setNewUser(e.target.value)} className="w-32" placeholder="root" />
                </SectionItemControl>
              </SectionItem>
              <SectionItem>
                <SectionItemLabel title="IdentityFile" />
                <SectionItemControl>
                  <Input value={newIdentityFile} onChange={(e) => setNewIdentityFile(e.target.value)} className="w-48" placeholder="~/.ssh/id_ed25519" />
                </SectionItemControl>
              </SectionItem>
              <SectionItem>
                <div />
                <SectionItemControl>
                  <Button size="sm" onClick={handleAddHost} disabled={!newHost.trim()}>Add</Button>
                </SectionItemControl>
              </SectionItem>
            </SectionContent>
          )}

          {/* Host blocks list */}
          <SectionContent>
            {hostBlocks.length === 0 ? (
              <SectionItem><p className="text-sm text-muted-foreground">No host entries in ~/.ssh/config</p></SectionItem>
            ) : (
              hostBlocks.map((block) => (
                <SectionItem key={block.host}>
                  <SectionItemLabel>
                    <span className="text-sm font-medium">{block.host}</span>
                    <span className="text-xs text-muted-foreground">
                      {block.hostname && `${block.user ? `${block.user}@` : ""}${block.hostname}`}
                      {block.port && `:${block.port}`}
                    </span>
                  </SectionItemLabel>
                  <SectionItemControl>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeHostBlock(block.host)}>
                      Remove
                    </Button>
                  </SectionItemControl>
                </SectionItem>
              ))
            )}
          </SectionContent>
        </Section>
      )}
    </div>
  );
}

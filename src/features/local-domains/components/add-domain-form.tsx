import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Section,
  SectionContent,
  SectionHeader,
  SectionItem,
  SectionItemControl,
  SectionItemLabel,
  SectionTitle,
} from "@/components/ui/section";
import { sanitizeDomain, getDomainError } from "../utils/validate-domain";

interface AddDomainFormProps {
  onAdd: (domain: string, port: number) => Promise<void>;
  isAdding: boolean;
  externalError: string | null;
}

export function AddDomainForm({ onAdd, isAdding, externalError }: AddDomainFormProps) {
  const [domain, setDomain] = useState("");
  const [port, setPort] = useState("3000");
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    const clean = sanitizeDomain(domain);
    const validationError = getDomainError(clean);
    if (validationError) {
      setError(validationError);
      return;
    }

    const portNum = parseInt(port, 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      setError("Port must be between 1 and 65535");
      return;
    }

    setError(null);
    await onAdd(clean, portNum);
    setDomain("");
    setPort("3000");
  };

  const displayError = error || externalError;

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>Add Domain</SectionTitle>
      </SectionHeader>
      <SectionContent>
        <SectionItem>
          <div className="flex items-center gap-2 flex-1">
            <Input
              value={domain}
              onChange={(e) => { setDomain(e.target.value); setError(null); }}
              placeholder="myapp.local"
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Input
              value={port}
              onChange={(e) => setPort(e.target.value)}
              placeholder="3000"
              className="w-24 font-mono"
              type="number"
              min={1}
              max={65535}
            />
          </div>
          <SectionItemControl>
            <Button size="sm" onClick={handleAdd} disabled={isAdding}>
              {isAdding ? "Adding..." : "Add"}
            </Button>
          </SectionItemControl>
        </SectionItem>
        {displayError && (
          <SectionItem>
            <SectionItemLabel>
              <p className="text-sm text-destructive">{displayError}</p>
            </SectionItemLabel>
          </SectionItem>
        )}
      </SectionContent>
    </Section>
  );
}

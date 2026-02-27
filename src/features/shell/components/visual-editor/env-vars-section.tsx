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
import type { ZshrcEnvVar } from "@/features/shell/utils/parse-zshrc";
import { createEmptyEnvVar } from "@/features/shell/utils/parse-zshrc";
import {
  Add01Icon,
  Delete02Icon,
  EarthIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface EnvVarsSectionProps {
  items: ZshrcEnvVar[];
  onChange: (items: ZshrcEnvVar[]) => void;
}

export function EnvVarsSection({ items, onChange }: EnvVarsSectionProps) {
  const updateItem = (id: string, field: "name" | "value", val: string) => {
    onChange(items.map((v) => (v.id === id ? { ...v, [field]: val } : v)));
  };

  const removeItem = (id: string) => {
    onChange(items.filter((v) => v.id !== id));
  };

  const addItem = () => {
    onChange([...items, createEmptyEnvVar()]);
  };

  return (
    <Section>
      <SectionHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HugeiconsIcon
              icon={EarthIcon}
              strokeWidth={2}
              className="size-4 text-muted-foreground"
            />
            <SectionTitle className="text-sm">
              Environment Variables
            </SectionTitle>
            <span className="text-xs text-muted-foreground">
              ({items.length})
            </span>
          </div>
          <Button variant="outline" size="xs" onClick={addItem}>
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-3" />
            Add
          </Button>
        </div>
      </SectionHeader>

      {items.length > 0 ? (
        <SectionContent>
          {items.map((item) => (
            <SectionItem key={item.id} className="gap-2">
              <SectionItemLabel className="flex-row items-center gap-2">
                <Input
                  value={item.name}
                  onChange={(e) => updateItem(item.id, "name", e.target.value)}
                  placeholder="VAR_NAME"
                  className="font-mono text-xs h-7 w-36 shrink-0"
                />
                <span className="text-muted-foreground text-xs">=</span>
                <Input
                  value={item.value}
                  onChange={(e) => updateItem(item.id, "value", e.target.value)}
                  placeholder="value"
                  className="font-mono text-xs h-7"
                />
              </SectionItemLabel>
              <SectionItemControl>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => removeItem(item.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <HugeiconsIcon
                    icon={Delete02Icon}
                    strokeWidth={2}
                    className="size-3.5"
                  />
                </Button>
              </SectionItemControl>
            </SectionItem>
          ))}
        </SectionContent>
      ) : (
        <p className="text-xs text-muted-foreground px-1">
          No environment variables defined. Click "Add" to create one.
        </p>
      )}
    </Section>
  );
}

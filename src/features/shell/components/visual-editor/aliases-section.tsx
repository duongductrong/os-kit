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
import type { ZshrcAlias } from "@/features/shell/utils/parse-zshrc";
import { createEmptyAlias } from "@/features/shell/utils/parse-zshrc";
import {
  Add01Icon,
  CommandLineIcon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface AliasesSectionProps {
  items: ZshrcAlias[];
  onChange: (items: ZshrcAlias[]) => void;
}

export function AliasesSection({ items, onChange }: AliasesSectionProps) {
  const updateItem = (
    id: string,
    field: "name" | "command",
    val: string
  ) => {
    onChange(items.map((a) => (a.id === id ? { ...a, [field]: val } : a)));
  };

  const removeItem = (id: string) => {
    onChange(items.filter((a) => a.id !== id));
  };

  const addItem = () => {
    onChange([...items, createEmptyAlias()]);
  };

  return (
    <Section>
      <SectionHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HugeiconsIcon
              icon={CommandLineIcon}
              strokeWidth={2}
              className="size-4 text-muted-foreground"
            />
            <SectionTitle className="text-sm">Aliases</SectionTitle>
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
                  placeholder="alias_name"
                  className="font-mono text-xs h-7 w-32 shrink-0"
                />
                <span className="text-muted-foreground text-xs shrink-0">→</span>
                <Input
                  value={item.command}
                  onChange={(e) =>
                    updateItem(item.id, "command", e.target.value)
                  }
                  placeholder="command --flags"
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
          No aliases defined. Click "Add" to create one.
        </p>
      )}
    </Section>
  );
}

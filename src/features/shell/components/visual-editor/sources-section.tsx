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
import type { ZshrcSource } from "@/features/shell/utils/parse-zshrc";
import { createEmptySource } from "@/features/shell/utils/parse-zshrc";
import {
  Add01Icon,
  Delete02Icon,
  PlugIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface SourcesSectionProps {
  items: ZshrcSource[];
  onChange: (items: ZshrcSource[]) => void;
}

export function SourcesSection({ items, onChange }: SourcesSectionProps) {
  const updateItem = (id: string, path: string) => {
    onChange(items.map((s) => (s.id === id ? { ...s, path } : s)));
  };

  const removeItem = (id: string) => {
    onChange(items.filter((s) => s.id !== id));
  };

  const addItem = () => {
    onChange([...items, createEmptySource()]);
  };

  return (
    <Section>
      <SectionHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HugeiconsIcon
              icon={PlugIcon}
              strokeWidth={2}
              className="size-4 text-muted-foreground"
            />
            <SectionTitle className="text-sm">Sources & Plugins</SectionTitle>
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
                <span className="text-muted-foreground text-xs shrink-0 font-mono">
                  source
                </span>
                <Input
                  value={item.path}
                  onChange={(e) => updateItem(item.id, e.target.value)}
                  placeholder="~/.nvm/nvm.sh"
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
          No source files or plugins. Click "Add" to include one.
        </p>
      )}
    </Section>
  );
}

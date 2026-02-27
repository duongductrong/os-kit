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
import type { ZshrcPathEntry } from "@/features/shell/utils/parse-zshrc";
import { createEmptyPathEntry } from "@/features/shell/utils/parse-zshrc";
import {
  Add01Icon,
  Delete02Icon,
  FolderFileStorageIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface PathEntriesSectionProps {
  items: ZshrcPathEntry[];
  onChange: (items: ZshrcPathEntry[]) => void;
}

export function PathEntriesSection({
  items,
  onChange,
}: PathEntriesSectionProps) {
  const updateItem = (id: string, path: string) => {
    onChange(items.map((p) => (p.id === id ? { ...p, path } : p)));
  };

  const removeItem = (id: string) => {
    onChange(items.filter((p) => p.id !== id));
  };

  const addItem = () => {
    onChange([...items, createEmptyPathEntry()]);
  };

  return (
    <Section>
      <SectionHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HugeiconsIcon
              icon={FolderFileStorageIcon}
              strokeWidth={2}
              className="size-4 text-muted-foreground"
            />
            <SectionTitle className="text-sm">PATH Entries</SectionTitle>
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
          {items.map((item, index) => (
            <SectionItem key={item.id} className="gap-2">
              <SectionItemLabel className="flex-row items-center gap-2">
                <span className="text-muted-foreground/50 text-xs font-mono w-5 text-right shrink-0">
                  {index + 1}
                </span>
                <Input
                  value={item.path}
                  onChange={(e) => updateItem(item.id, e.target.value)}
                  placeholder="/usr/local/bin"
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
          No custom PATH entries. Click "Add" to append a directory.
        </p>
      )}
    </Section>
  );
}

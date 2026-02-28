import { createFileRoute } from "@tanstack/react-router";

import {
  Section,
  SectionHeader,
  SectionTitle,
  SectionDescription,
  SectionContent,
  SectionItem,
  SectionItemLabel,
  SectionItemControl,
} from "@/components/ui/section";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/contexts/settings-context";

export const Route = createFileRoute("/")(
  { component: Index },
);

export default function Index() {
  const { settings, updateSetting } = useSettings();

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto w-full">
      {/* General settings */}
      <Section>
        <SectionHeader>
          <SectionTitle>General</SectionTitle>
          <SectionDescription>
            Configure general application settings
          </SectionDescription>
        </SectionHeader>

        <SectionContent>
          <SectionItem>
            <SectionItemLabel
              title="Default open destination"
              description="Where the app navigates on launch"
            />
            <SectionItemControl>
              <Select
                value={settings.defaultOpenDestination}
                onValueChange={(val) =>
                  updateSetting(
                    "defaultOpenDestination",
                    val as typeof settings.defaultOpenDestination,
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="installation">Installation</SelectItem>
                  <SelectItem value="shell">Shell</SelectItem>
                  <SelectItem value="settings">Settings</SelectItem>
                </SelectContent>
              </Select>
            </SectionItemControl>
          </SectionItem>

          <SectionItem>
            <SectionItemLabel
              title="Language"
              description="Language for the app UI"
            />
            <SectionItemControl>
              <Select
                value={settings.language}
                onValueChange={(val) =>
                  updateSetting("language", val as typeof settings.language)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="vi">Tiếng Việt</SelectItem>
                </SelectContent>
              </Select>
            </SectionItemControl>
          </SectionItem>

          <SectionItem>
            <SectionItemLabel
              title="Prevent sleep while running"
              description="Keep your computer awake while running a thread"
            />
            <SectionItemControl>
              <Switch
                checked={settings.preventSleep}
                onCheckedChange={(val) => updateSetting("preventSleep", val)}
              />
            </SectionItemControl>
          </SectionItem>
        </SectionContent>
      </Section>

      {/* Appearance section */}
      <Section>
        <SectionHeader>
          <SectionTitle>Appearance</SectionTitle>
        </SectionHeader>

        <SectionContent>
          <SectionItem>
            <SectionItemLabel
              title="Theme"
              description="Use light, dark, or match your system"
            />
            <SectionItemControl>
              <Select
                value={settings.theme}
                onValueChange={(val) =>
                  updateSetting("theme", val as typeof settings.theme)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </SectionItemControl>
          </SectionItem>

          <SectionItem>
            <SectionItemLabel
              title="Use opaque window background"
              description="Make windows use a solid background rather than system translucency"
            />
            <SectionItemControl>
              <Switch
                checked={settings.opaqueBackground}
                onCheckedChange={(val) =>
                  updateSetting("opaqueBackground", val)
                }
              />
            </SectionItemControl>
          </SectionItem>

          <SectionItem>
            <SectionItemLabel
              title="Font size"
              description="Adjust the base font size for the UI"
            />
            <SectionItemControl>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={12}
                  max={20}
                  step={1}
                  value={settings.fontSize}
                  onChange={(e) =>
                    updateSetting("fontSize", Number(e.target.value))
                  }
                  className="w-24 accent-primary"
                />
                <span className="text-sm text-muted-foreground font-mono w-8 text-right">
                  {settings.fontSize}px
                </span>
              </div>
            </SectionItemControl>
          </SectionItem>
        </SectionContent>
      </Section>
    </div>
  );
}

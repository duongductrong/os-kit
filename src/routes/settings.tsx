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
import { useSettings } from "@/contexts/settings-context";
import { AppearancePicker } from "@/features/settings/components/appearance-picker";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

export default function SettingsPage() {
  const { settings, updateSetting } = useSettings();

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Customize the appearance and behavior of Oskit.
        </p>
      </div>

      <Section>
        <SectionHeader>
          <SectionTitle>Appearance</SectionTitle>
          <SectionDescription>
            Choose how Oskit looks on your device.
          </SectionDescription>
        </SectionHeader>
        <SectionContent>
          <SectionItem>
            <SectionItemLabel
              title="Theme"
              description="Select light, dark, or match your system setting."
            />
            <SectionItemControl>
              <AppearancePicker
                value={settings.theme}
                onChange={(theme) => updateSetting("theme", theme)}
              />
            </SectionItemControl>
          </SectionItem>
        </SectionContent>
      </Section>
    </div>
  );
}

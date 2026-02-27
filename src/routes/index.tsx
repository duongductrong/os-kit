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

export const Route = createFileRoute("/")({
  component: Index,
});

export default function Index() {
  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto  w-full">
      {/* Example 1: General settings */}
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
              description="Where files and folders open by default"
            />
            <SectionItemControl>
              <span className="text-sm text-muted-foreground">Antigravity</span>
            </SectionItemControl>
          </SectionItem>

          <SectionItem>
            <SectionItemLabel
              title="Language"
              description="Language for the app UI"
            />
            <SectionItemControl>
              <span className="text-sm text-muted-foreground">Auto Detect</span>
            </SectionItemControl>
          </SectionItem>

          <SectionItem>
            <SectionItemLabel
              title="Prevent sleep while running"
              description="Keep your computer awake while running a thread"
            />
            <SectionItemControl>
              <div className="h-5 w-9 rounded-full bg-muted" />
            </SectionItemControl>
          </SectionItem>
        </SectionContent>
      </Section>

      {/* Example 2: Appearance section */}
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
              <span className="text-sm text-muted-foreground">System</span>
            </SectionItemControl>
          </SectionItem>

          <SectionItem>
            <SectionItemLabel
              title="Use opaque window background"
              description="Make windows use a solid background rather than system translucency"
            />
            <SectionItemControl>
              <div className="h-5 w-9 rounded-full bg-muted" />
            </SectionItemControl>
          </SectionItem>

          <SectionItem>
            <SectionItemLabel
              title="Sans font family"
              description="Adjust the font used for the UI"
            />
            <SectionItemControl>
              <span className="text-sm text-muted-foreground">14px</span>
            </SectionItemControl>
          </SectionItem>
        </SectionContent>
      </Section>
    </div>
  );
}

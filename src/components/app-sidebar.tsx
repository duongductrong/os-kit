import * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavSecondary } from "@/components/nav-secondary";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  BookOpen02Icon,
  ChartRingIcon,
  ComputerTerminalIcon,
  CropIcon,
  MapsIcon,
  PieChartIcon,
  RoboticIcon,
  SentIcon,
  Setting07Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useOutdatedCount } from "@/hooks/use-outdated-count";

function useNavData() {
  const outdatedCount = useOutdatedCount();

  return {
  navMain: [
    {
      title: "Mac",
      url: "#",
      icon: <HugeiconsIcon icon={ComputerTerminalIcon} strokeWidth={2} />,
      isActive: true,
      items: [
        {
          title: "Installation",
          url: "/installation",
          badge: outdatedCount,
        },
        {
          title: "Shell",
          url: "/shell",
        },
        {
          title: "Git Config",
          url: "/git-config",
        },
        {
          title: "SSH",
          url: "/ssh",
        },
        {
          title: "Hosts",
          url: "/hosts",
        },
        {
          title: "Local Domains",
          url: "/local-domains",
        },
        {
          title: "Ports",
          url: "/ports",
        },
        {
          title: "System Info",
          url: "/system-info",
        },
        {
          title: "Recipe",
          url: "/recipe",
        },
      ],
    },
    {
      title: "Developer Apps",
      url: "#",
      icon: <HugeiconsIcon icon={ComputerTerminalIcon} strokeWidth={2} />,
      items: [
        {
          title: "Antigravity",
          url: "#",
        },
      ],
    },
    {
      title: "LLMs",
      url: "#",
      icon: <HugeiconsIcon icon={RoboticIcon} strokeWidth={2} />,
      items: [
        {
          title: "Ollama",
          url: "#",
        },
        {
          title: "LM Studio",
          url: "#",
        },
        {
          title: "Quantum",
          url: "#",
        },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: <HugeiconsIcon icon={BookOpen02Icon} strokeWidth={2} />,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: (
        <HugeiconsIcon
          icon={ChartRingIcon}
          strokeWidth={2}
          className="size-4 text-muted-foreground"
        />
      ),
    },
    {
      title: "Feedback",
      url: "#",
      icon: (
        <HugeiconsIcon
          icon={SentIcon}
          strokeWidth={2}
          className="size-4 text-muted-foreground"
        />
      ),
    },
    {
      title: "Settings",
      url: "/settings",
      icon: (
        <HugeiconsIcon
          icon={Setting07Icon}
          strokeWidth={2}
          className="size-4 text-muted-foreground"
        />
      ),
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: <HugeiconsIcon icon={CropIcon} strokeWidth={2} />,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: <HugeiconsIcon icon={PieChartIcon} strokeWidth={2} />,
    },
    {
      name: "Travel",
      url: "#",
      icon: <HugeiconsIcon icon={MapsIcon} strokeWidth={2} />,
    },
  ],
};
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const data = useNavData();
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader className="h-8" />
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarFooter>
    </Sidebar>
  );
}

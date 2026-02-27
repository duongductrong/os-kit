"use client";

import * as React from "react";

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export function NavSecondary({
  items,
  className,
  ...props
}: {
  items: {
    title: string;
    url: string;
    icon: React.ReactNode;
  }[];
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  return (
    <SidebarGroup
      {...props}
      className={cn(
        "flex items-center justify-between flex-row px-0 pb-0",
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium flex-1">
          Oskit
          <small className="text-xs font-light text-muted-foreground ml-1">
            v1.0.0
          </small>
        </p>
      </div>

      <SidebarMenu className="flex flex-row w-fit">
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <Tooltip>
              <TooltipTrigger>
                <SidebarMenuButton size="sm" render={<a href={item.url} />}>
                  {item.icon}
                </SidebarMenuButton>
              </TooltipTrigger>
              <TooltipContent>{item.title}</TooltipContent>
            </Tooltip>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

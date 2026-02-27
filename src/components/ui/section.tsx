import * as React from "react";

import { cn } from "@/lib/utils";

function Section({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="section"
      className={cn("group/section flex flex-col gap-4", className)}
      {...props}
    />
  );
}

function SectionHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="section-header"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    />
  );
}

function SectionTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="section-title"
      className={cn("text-lg font-semibold tracking-tight", className)}
      {...props}
    />
  );
}

function SectionDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="section-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function SectionContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="section-content"
      className={cn("divide-border divide-y rounded-lg border", className)}
      {...props}
    />
  );
}

function SectionItem({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="section-item"
      className={cn(
        "flex items-center justify-between gap-4 px-4 py-3",
        "first:rounded-t-lg last:rounded-b-lg",
        className,
      )}
      {...props}
    />
  );
}

function SectionItemLabel({
  className,
  title,
  description,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <div
      data-slot="section-item-label"
      className={cn("flex min-w-0 flex-1 flex-col gap-0.5", className)}
      {...props}
    >
      {children ?? (
        <>
          {title && (
            <span className="text-sm font-medium leading-snug">{title}</span>
          )}
          {description && (
            <span className="text-muted-foreground text-xs leading-normal">
              {description}
            </span>
          )}
        </>
      )}
    </div>
  );
}

function SectionItemControl({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="section-item-control"
      className={cn("flex shrink-0 items-center gap-2", className)}
      {...props}
    />
  );
}

export {
  Section,
  SectionHeader,
  SectionTitle,
  SectionDescription,
  SectionContent,
  SectionItem,
  SectionItemLabel,
  SectionItemControl,
};

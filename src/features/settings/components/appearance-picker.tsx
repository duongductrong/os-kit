import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";

interface AppearancePickerProps {
  value: Theme;
  onChange: (theme: Theme) => void;
}

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "Auto" },
];

/**
 * macOS-style appearance picker with visual window thumbnails
 * for light, dark, and auto (system) modes.
 */
export function AppearancePicker({ value, onChange }: AppearancePickerProps) {
  return (
    <div className="flex gap-3">
      {THEME_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "flex flex-col items-center gap-1.5 rounded-lg p-2 transition-colors",
            "hover:bg-accent/50",
            value === option.value && "bg-accent ring-2 ring-primary",
          )}
        >
          <ThemeThumbnail theme={option.value} />
          <span className="text-xs font-medium">{option.label}</span>
        </button>
      ))}
    </div>
  );
}

/** Mini window thumbnail mimicking macOS System Settings appearance picker */
function ThemeThumbnail({ theme }: { theme: Theme }) {
  const isLight = theme === "light";
  const isDark = theme === "dark";
  const isSplit = theme === "system";

  return (
    <div
      className={cn(
        "relative h-[60px] w-[86px] overflow-hidden rounded-md border shadow-sm",
      )}
    >
      {isSplit ? (
        /* Split view: left light, right dark */
        <div className="flex h-full">
          <div className="flex-1 bg-[#f5f5f7]">
            <SplitWindowChrome variant="light" />
          </div>
          <div className="flex-1 bg-[#2a2a2c]">
            <SplitWindowChrome variant="dark" />
          </div>
        </div>
      ) : (
        /* Full light or dark */
        <div
          className={cn(
            "h-full w-full",
            isLight && "bg-[#f5f5f7]",
            isDark && "bg-[#2a2a2c]",
          )}
        >
          <WindowChrome variant={isLight ? "light" : "dark"} />
        </div>
      )}
    </div>
  );
}

/** Simulated window chrome with sidebar + content area */
function WindowChrome({ variant }: { variant: "light" | "dark" }) {
  const isLight = variant === "light";
  return (
    <div className="flex h-full flex-col p-1.5">
      {/* Traffic lights */}
      <div className="mb-1 flex gap-[3px]">
        <div className="size-[5px] rounded-full bg-[#ff5f57]" />
        <div className="size-[5px] rounded-full bg-[#febc2e]" />
        <div className="size-[5px] rounded-full bg-[#28c840]" />
      </div>
      {/* Window body: sidebar + content */}
      <div className="flex flex-1 gap-1 overflow-hidden rounded-sm">
        <div
          className={cn(
            "w-[22px] shrink-0 rounded-sm",
            isLight ? "bg-[#e8e8ea]" : "bg-[#3a3a3c]",
          )}
        >
          {/* Sidebar lines */}
          <div className="flex flex-col gap-[3px] p-1 pt-1.5">
            <div
              className={cn(
                "h-[2px] w-full rounded-full",
                isLight ? "bg-[#c8c8ca]" : "bg-[#555557]",
              )}
            />
            <div
              className={cn(
                "h-[2px] w-3/4 rounded-full",
                isLight ? "bg-[#c8c8ca]" : "bg-[#555557]",
              )}
            />
            <div
              className={cn(
                "h-[2px] w-full rounded-full",
                isLight ? "bg-[#c8c8ca]" : "bg-[#555557]",
              )}
            />
          </div>
        </div>
        <div
          className={cn(
            "flex-1 rounded-sm",
            isLight ? "bg-white" : "bg-[#1e1e20]",
          )}
        >
          {/* Content lines */}
          <div className="flex flex-col gap-[3px] p-1.5">
            <div
              className={cn(
                "h-[2px] w-full rounded-full",
                isLight ? "bg-[#d4d4d6]" : "bg-[#444446]",
              )}
            />
            <div
              className={cn(
                "h-[2px] w-2/3 rounded-full",
                isLight ? "bg-[#d4d4d6]" : "bg-[#444446]",
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Half-width version for the split "Auto" thumbnail */
function SplitWindowChrome({ variant }: { variant: "light" | "dark" }) {
  const isLight = variant === "light";
  return (
    <div className="flex h-full flex-col px-1 pt-1.5">
      {/* Half traffic lights on left side only */}
      {isLight && (
        <div className="mb-1 flex gap-[3px]">
          <div className="size-[5px] rounded-full bg-[#ff5f57]" />
          <div className="size-[5px] rounded-full bg-[#febc2e]" />
        </div>
      )}
      {!isLight && (
        <div className="mb-1 flex gap-[3px]">
          <div className="size-[5px] rounded-full bg-[#28c840]" />
        </div>
      )}
      {/* Content lines */}
      <div className="flex flex-col gap-[3px] pt-1">
        <div
          className={cn(
            "h-[2px] w-full rounded-full",
            isLight ? "bg-[#c8c8ca]" : "bg-[#555557]",
          )}
        />
        <div
          className={cn(
            "h-[2px] w-3/4 rounded-full",
            isLight ? "bg-[#c8c8ca]" : "bg-[#555557]",
          )}
        />
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

const FEATURES = [
  {
    title: "Installation",
    description: "Manage packages & detect outdated versions",
    href: "/installation",
    accent: "#f59e0b",
  },
  {
    title: "Shell",
    description: "Configure zsh, aliases & PATH entries",
    href: "/shell",
    accent: "#34d399",
  },
  {
    title: "Git Config",
    description: "Manage global and local git settings",
    href: "/git-config",
    accent: "#fb7185",
  },
  {
    title: "SSH",
    description: "Generate and manage SSH keys",
    href: "/ssh",
    accent: "#60a5fa",
  },
  {
    title: "Hosts",
    description: "Edit your system hosts file",
    href: "/hosts",
    accent: "#a78bfa",
  },
  {
    title: "Local Domains",
    description: "SSL certificates & proxy routing",
    href: "/local-domains",
    accent: "#22d3ee",
  },
  {
    title: "Ports",
    description: "Inspect & manage listening ports",
    href: "/ports",
    accent: "#f472b6",
  },
  {
    title: "System Info",
    description: "Hardware, OS & runtime details",
    href: "/system-info",
    accent: "#94a3b8",
  },
] as const;

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function Index() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-[calc(100svh-2rem)] overflow-hidden select-none">
      {/* Dot-grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--border) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Warm ambient glow */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-[520px] rounded-full opacity-[0.12] blur-2xl"
        style={{
          background:
            "radial-gradient(circle, #f59e0b 0%, transparent 70%)",
        }}
      />

      {/* Hero */}
      <div className="relative z-10 flex flex-col items-center gap-1.5 mb-10 welcome-stagger">
        <span className="text-[11px] text-muted-foreground/70 tracking-[0.25em] uppercase font-medium">
          {getGreeting()}
        </span>
        <h1 className="text-[3.2rem] font-extrabold tracking-[-0.04em] leading-none bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
          Oskit
        </h1>
        <p className="text-muted-foreground text-[13px] max-w-[260px] text-center leading-relaxed mt-1">
          Your developer environment, organized.
        </p>
      </div>

      {/* Feature grid */}
      <div className="relative z-10 grid grid-cols-2 gap-2.5 w-full max-w-[460px] px-4">
        {FEATURES.map((feature, i) => (
          <Link
            key={feature.href}
            to={feature.href}
            className="welcome-stagger group flex items-stretch rounded-lg border border-border/60 bg-card/50 backdrop-blur-sm hover:bg-card hover:border-border hover:shadow-sm transition-all duration-200 cursor-default"
            style={{ animationDelay: `${80 + i * 50}ms` }}
          >
            {/* Colored accent bar */}
            <div
              className="w-[3px] shrink-0 rounded-l-lg transition-all duration-200 group-hover:w-[4px]"
              style={{ backgroundColor: feature.accent }}
            />
            <div className="flex flex-col gap-px px-3 py-2.5 min-w-0">
              <span className="text-[13px] font-semibold tracking-tight truncate">
                {feature.title}
              </span>
              <span className="text-[11px] text-muted-foreground/80 leading-snug line-clamp-2">
                {feature.description}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Version badge */}
      <div
        className="welcome-stagger relative z-10 mt-8 flex items-center gap-2"
        style={{ animationDelay: "520ms" }}
      >
        <span className="text-[10px] text-muted-foreground/40 font-mono tracking-widest">
          v0.1.0
        </span>
      </div>
    </div>
  );
}

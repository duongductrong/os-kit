import { createFileRoute } from "@tanstack/react-router";
import { ProjectLauncher } from "@/features/projects/components/project-launcher";

export const Route = createFileRoute("/projects")({
  component: ProjectsPage,
});

export default function ProjectsPage() {
  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
        <p className="text-sm text-muted-foreground">
          Discover projects in your directories and open them in your IDE.
        </p>
      </div>
      <ProjectLauncher />
    </div>
  );
}

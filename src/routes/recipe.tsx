import { createFileRoute } from "@tanstack/react-router";
import { RecipeManager } from "@/features/recipe/components/recipe-manager";

export const Route = createFileRoute("/recipe")({
  component: RecipePage,
});

export default function RecipePage() {
  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Setup Recipe</h1>
        <p className="text-sm text-muted-foreground">
          Export your current setup or import a recipe to replicate it.
        </p>
      </div>
      <RecipeManager />
    </div>
  );
}

import { parse } from "yaml";

export interface Recipe {
  version: number;
  exported_at: string;
  tools: { id: string }[];
  settings: Record<string, unknown>;
  configs?: Record<string, string>;
}

/** Parse and validate a recipe YAML string */
export function parseRecipe(yamlContent: string): Recipe {
  const data = parse(yamlContent);

  if (!data || typeof data !== "object") {
    throw new Error("Invalid recipe format");
  }

  if (data.version !== 1) {
    throw new Error(`Unsupported recipe version: ${data.version}`);
  }

  if (!Array.isArray(data.tools)) {
    throw new Error("Recipe missing tools array");
  }

  return {
    version: data.version,
    exported_at: data.exported_at || "",
    tools: data.tools.map((t: { id: string }) => ({ id: t.id })),
    settings: data.settings || {},
    configs: data.configs,
  };
}

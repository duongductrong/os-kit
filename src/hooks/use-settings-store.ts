import { load } from "@tauri-apps/plugin-store";
import { useCallback, useEffect, useRef, useState } from "react";

export interface AppSettings {
  // General
  language: "en" | "vi";
  defaultOpenDestination: "installation" | "shell" | "settings";
  preventSleep: boolean;

  // Appearance
  theme: "light" | "dark" | "system";
  opaqueBackground: boolean;
  fontSize: number; // 12-20

  // Project Launcher
  scanDirectories: string[];
  preferredIDE: string;
  scanDepth: number;

  // Onboarding
  onboardingCompleted: boolean;
  onboardingSkipped: boolean;

  // Internal
  lastUpdateCheck: number; // timestamp
}

export const DEFAULT_SETTINGS: AppSettings = {
  language: "en",
  defaultOpenDestination: "installation",
  preventSleep: false,
  theme: "system",
  opaqueBackground: false,
  fontSize: 14,
  scanDirectories: ["~/Developer", "~/Projects"],
  preferredIDE: "code",
  scanDepth: 2,
  onboardingCompleted: false,
  onboardingSkipped: false,
  lastUpdateCheck: 0,
};

const STORE_PATH = "settings.json";

/**
 * Low-level hook wrapping tauri-plugin-store for settings persistence.
 * Loads settings on mount, provides get/set with auto-save (debounced).
 */
export function useSettingsStore() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);
  const storeRef = useRef<Awaited<ReturnType<typeof load>> | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load store on mount
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const store = await load(STORE_PATH, {
          autoSave: false,
          defaults: { ...DEFAULT_SETTINGS } as { [key: string]: unknown },
        });
        if (cancelled) return;
        storeRef.current = store;

        // Read all settings, falling back to defaults
        const loaded: Partial<AppSettings> = {};
        for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof AppSettings)[]) {
          const val = await store.get<AppSettings[typeof key]>(key);
          if (val !== null && val !== undefined) {
            (loaded as Record<string, unknown>)[key] = val;
          }
        }

        if (!cancelled) {
          setSettings({ ...DEFAULT_SETTINGS, ...loaded });
          setIsLoaded(true);
        }
      } catch (err) {
        console.error("Failed to load settings store:", err);
        if (!cancelled) setIsLoaded(true);
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  // Debounced save
  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await storeRef.current?.save();
      } catch (err) {
        console.error("Failed to save settings:", err);
      }
    }, 300);
  }, []);

  const updateSetting = useCallback(
    async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
      try {
        await storeRef.current?.set(key, value);
        scheduleSave();
      } catch (err) {
        console.error(`Failed to set setting ${key}:`, err);
      }
    },
    [scheduleSave],
  );

  return { settings, isLoaded, updateSetting };
}

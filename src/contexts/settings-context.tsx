import { createContext, useContext, useEffect } from "react";
import {
  useSettingsStore,
  type AppSettings,
  DEFAULT_SETTINGS,
} from "@/hooks/use-settings-store";

interface SettingsContextValue {
  settings: AppSettings;
  isLoaded: boolean;
  updateSetting: <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  isLoaded: false,
  updateSetting: async () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { settings, isLoaded, updateSetting } = useSettingsStore();

  // Apply theme to <html> element
  useEffect(() => {
    if (!isLoaded) return;
    const root = document.documentElement;

    if (settings.theme === "dark") {
      root.classList.add("dark");
    } else if (settings.theme === "light") {
      root.classList.remove("dark");
    } else {
      // system
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const apply = () => {
        if (mq.matches) root.classList.add("dark");
        else root.classList.remove("dark");
      };
      apply();
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [settings.theme, isLoaded]);

  // Apply font size to root
  useEffect(() => {
    if (!isLoaded) return;
    document.documentElement.style.fontSize = `${settings.fontSize}px`;
  }, [settings.fontSize, isLoaded]);

  return (
    <SettingsContext.Provider value={{ settings, isLoaded, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

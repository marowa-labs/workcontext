"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useUser } from "../lib/utils/useUser";

export interface AppearanceSettings {
  theme: string;
  autoDarkMode: boolean;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  lineWidth: number;
  accentColor: string;
  sidebarPosition: string;
  density: string;
  animations: boolean;
  reduceMotion: boolean;
  // Layout preferences
  layoutDashboard: boolean;
  layoutSettings: boolean;
  layoutDocs: boolean;
}

interface ThemeContextType {
  settings: AppearanceSettings;
  updateSettings: (newSettings: Partial<AppearanceSettings>) => Promise<void>;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, loading: userLoading } = useUser();
  const [settings, setSettings] = useState<AppearanceSettings>({
    theme: "light",
    autoDarkMode: false,
    fontFamily: "Inter",
    fontSize: 18,
    lineHeight: 1.75,
    lineWidth: 700,
    accentColor: "blue",
    sidebarPosition: "left",
    density: "comfortable",
    animations: true,
    reduceMotion: false,
    // Layout preferences - default to true for all layouts
    layoutDashboard: true,
    layoutSettings: true,
    layoutDocs: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const settingsRef = useRef(settings);
  const initializedRef = useRef(false);

  // Update ref when settings change
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const applyTheme = useCallback((settingsToApply: AppearanceSettings) => {
    // Apply theme class to document
    if (settingsToApply.theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else if (settingsToApply.theme === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    } else {
      // System theme - check system preference
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (isDark) {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      } else {
        document.documentElement.classList.add("light");
        document.documentElement.classList.remove("dark");
      }
    }

    // Apply all CSS variables
    // Font family
    const fontMap: Record<string, string> = {
      serif: "Georgia, serif",
      Inter: "Inter, sans-serif",
      monospace: "Courier New, Courier, monospace",
      opendyslexic: "OpenDyslexic, sans-serif",
    };
    document.documentElement.style.setProperty(
      "--font-family",
      fontMap[settingsToApply.fontFamily] || fontMap.Inter,
    );

    // Font size
    document.documentElement.style.setProperty(
      "--font-size-base",
      `${settingsToApply.fontSize || 18}px`,
    );

    // Line height
    document.documentElement.style.setProperty(
      "--line-height-base",
      (settingsToApply.lineHeight || 1.75).toString(),
    );

    // Line width
    document.documentElement.style.setProperty(
      "--line-width-base",
      `${settingsToApply.lineWidth || 700}px`,
    );

    // Accent color
    const accentColors: Record<string, string> = {
      blue: "214 100% 59%",
      purple: "243 75% 59%",
      green: "151 55% 41%",
      orange: "38 92% 50%",
      pink: "322 80% 60%",
      red: "0 84% 60%",
      teal: "172 76% 41%",
      gray: "220 9% 46%",
    };

    const accentColor =
      accentColors[settingsToApply.accentColor] || accentColors.blue;
    document.documentElement.style.setProperty("--accent", accentColor);

    // Apply density settings by updating CSS classes on the body
    document.body.className = document.body.className
      .replace(/density-\w+/g, "")
      .trim();
    if (settingsToApply.density) {
      document.body.classList.add(`density-${settingsToApply.density}`);
    }

    // Apply animation settings
    if (settingsToApply.reduceMotion) {
      document.documentElement.style.setProperty(
        "animation-duration",
        "0.01ms",
      );
      document.documentElement.style.setProperty(
        "transition-duration",
        "0.01ms",
      );
    } else if (settingsToApply.animations === false) {
      document.documentElement.style.setProperty("animation-duration", "0ms");
      document.documentElement.style.setProperty("transition-duration", "0ms");
    } else {
      document.documentElement.style.removeProperty("animation-duration");
      document.documentElement.style.removeProperty("transition-duration");
    }
  }, []);

  // Load settings from localStorage
  useEffect(() => {
    // Only load settings if not still loading
    if (!userLoading && !initializedRef.current) {
      initializedRef.current = true;

      const loadSettings = async () => {
        try {
          setIsLoading(true);

          // Try to load from localStorage first
          const savedSettingsStr = localStorage.getItem("appearanceSettings");
          let savedSettings: Partial<AppearanceSettings> = {};

          if (savedSettingsStr) {
            try {
              savedSettings = JSON.parse(savedSettingsStr);
            } catch (e) {
              console.error("Error parsing saved settings:", e);
            }
          }

          // Ensure all settings have proper default values
          const completeSettings: AppearanceSettings = {
            theme: savedSettings.theme || "light",
            autoDarkMode: savedSettings.autoDarkMode ?? false,
            fontFamily: savedSettings.fontFamily || "Inter",
            fontSize: savedSettings.fontSize || 18,
            lineHeight: savedSettings.lineHeight || 1.75,
            lineWidth: savedSettings.lineWidth || 700,
            accentColor: savedSettings.accentColor || "blue",
            sidebarPosition: savedSettings.sidebarPosition || "left",
            density: savedSettings.density || "comfortable",
            animations: savedSettings.animations ?? true,
            reduceMotion: savedSettings.reduceMotion ?? false,
            // Layout preferences with defaults
            layoutDashboard: savedSettings.layoutDashboard ?? true,
            layoutSettings: savedSettings.layoutSettings ?? true,
            layoutDocs: savedSettings.layoutDocs ?? true,
          };

          setSettings(completeSettings);
          applyTheme(completeSettings);
        } catch (error) {
          console.error("Error loading appearance settings:", error);
          // Even if there's an error, stop loading so the UI can render
          // Apply default theme using the default settings
          const defaultSettings: AppearanceSettings = {
            theme: "light",
            autoDarkMode: false,
            fontFamily: "Inter",
            fontSize: 18,
            lineHeight: 1.75,
            lineWidth: 700,
            accentColor: "blue",
            sidebarPosition: "left",
            density: "comfortable",
            animations: true,
            reduceMotion: false,
            // Layout preferences - default to true for all layouts
            layoutDashboard: true,
            layoutSettings: true,
            layoutDocs: true,
          };
          applyTheme(defaultSettings);
        } finally {
          setIsLoading(false);
        }
      };

      loadSettings();
    }
  }, [userLoading, applyTheme]);

  const updateSettings = useCallback(
    async (newSettings: Partial<AppearanceSettings>) => {
      try {
        // Update the settings in state
        const updatedSettings = {
          ...settingsRef.current,
          ...newSettings,
        };

        // Save to localStorage
        localStorage.setItem(
          "appearanceSettings",
          JSON.stringify(updatedSettings),
        );

        // Update state and apply theme
        setSettings(updatedSettings);
        applyTheme(updatedSettings);
      } catch (error) {
        console.error("Error updating appearance settings:", error);
        throw error;
      }
    },
    [applyTheme],
  );

  // Listen for system theme changes when using system theme
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (settingsRef.current.theme === "system") {
        applyTheme(settingsRef.current);
      }
    };

    // Apply initial system theme if needed
    if (settingsRef.current.theme === "system") {
      applyTheme(settingsRef.current);
    }

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [applyTheme]); // Use ref instead of settings

  return (
    <ThemeContext.Provider value={{ settings, updateSettings, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

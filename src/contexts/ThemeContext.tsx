import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  increaseContrast: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setIncreaseContrast: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("phonix-theme") as Theme;
      if (stored) return stored;
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "dark";
  });
  const [increaseContrast, setIncreaseContrastState] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("phonix-increase-contrast") === "true";
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("phonix-theme", theme);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle("increase-contrast", increaseContrast);
    localStorage.setItem("phonix-increase-contrast", String(increaseContrast));
  }, [increaseContrast]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === "light" ? "dark" : "light"));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const setIncreaseContrast = (enabled: boolean) => {
    setIncreaseContrastState(enabled);
  };

  return (
    <ThemeContext.Provider value={{ theme, increaseContrast, toggleTheme, setTheme, setIncreaseContrast }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

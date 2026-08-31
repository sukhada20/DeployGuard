"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-8 h-8 border-2 border-border bg-card flex items-center justify-center text-muted-foreground">
        <span className="w-3.5 h-3.5" />
      </div>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative overflow-hidden group w-8 h-8 border-2 border-border bg-card flex items-center justify-center hover:border-foreground transition-colors cursor-pointer select-none"
      title={`Switch to ${isDark ? "Light" : "Dark"} mode`}
      aria-label="Toggle theme"
    >
      {/* Wipe Rectangle from bottom to top */}
      <span className="absolute inset-0 bg-foreground translate-y-full group-hover:translate-y-0 transition-transform duration-200 ease-out pointer-events-none" />

      {/* Monochrome Icon */}
      <span className="relative z-10 text-foreground group-hover:text-background transition-colors duration-200 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-3.5 h-3.5" />
        ) : (
          <Moon className="w-3.5 h-3.5" />
        )}
      </span>
    </button>
  );
}

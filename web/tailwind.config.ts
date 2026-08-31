import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // Semantic highlight accents
        emerald: {
          DEFAULT: "hsl(var(--emerald))",
          foreground: "hsl(var(--emerald-foreground))",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
        },
        rose: {
          DEFAULT: "hsl(var(--rose))",
          foreground: "hsl(var(--rose-foreground))",
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48",
        },
        amber: {
          DEFAULT: "hsl(var(--amber))",
          foreground: "hsl(var(--amber-foreground))",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
        cyan: {
          DEFAULT: "hsl(var(--cyan))",
          foreground: "hsl(var(--cyan-foreground))",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
        },
        indigo: {
          DEFAULT: "hsl(var(--indigo))",
          foreground: "hsl(var(--indigo-foreground))",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
        },
      },
      borderRadius: {
        none: "0px",
        sm: "calc(var(--radius) - 2px)",
        DEFAULT: "var(--radius)",
        md: "calc(var(--radius) + 2px)",
        lg: "calc(var(--radius) + 4px)",
      },
      fontFamily: {
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;

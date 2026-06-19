import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "oklch(var(--background) / <alpha-value>)",
        foreground: "oklch(var(--foreground) / <alpha-value>)",
        card: {
          DEFAULT: "oklch(var(--card) / <alpha-value>)",
          foreground: "oklch(var(--card-foreground) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "oklch(0.45 0.18 255)",
          foreground: "oklch(0.985 0.002 247)",
        },
        secondary: {
          DEFAULT: "oklch(0.955 0.008 247)",
          foreground: "oklch(0.25 0.02 247)",
        },
        muted: {
          DEFAULT: "oklch(0.955 0.008 247)",
          foreground: "oklch(0.5 0.02 247)",
        },
        accent: {
          DEFAULT: "oklch(0.955 0.008 247)",
          foreground: "oklch(0.25 0.02 247)",
        },
        destructive: {
          DEFAULT: "oklch(0.55 0.22 25)",
          foreground: "white",
        },
        border: "oklch(0.9 0.01 247)",
        input: "oklch(0.9 0.01 247)",
        ring: "oklch(0.45 0.18 255)",
        popover: {
          DEFAULT: "white",
          foreground: "oklch(0.145 0.014 247)",
        },
        sidebar: {
          DEFAULT: "oklch(0.985 0.002 247)",
          foreground: "oklch(0.145 0.014 247)",
          primary: "oklch(0.45 0.18 255)",
          "primary-foreground": "oklch(0.985 0.002 247)",
          accent: "oklch(0.955 0.008 247)",
          "accent-foreground": "oklch(0.25 0.02 247)",
          border: "oklch(0.9 0.01 247)",
          ring: "oklch(0.45 0.18 255)",
        },
      },
      borderRadius: {
        lg: "0.625rem",
        md: "calc(0.625rem - 2px)",
        sm: "calc(0.625rem - 4px)",
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
}

export default config


import type { Config } from "tailwindcss";

export default {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        // System semantic colors
        background: "rgb(var(--background))",
        foreground: "rgb(var(--foreground))",
        card: {
          DEFAULT: "rgb(var(--card))",
          foreground: "rgb(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "rgb(var(--popover))",
          foreground: "rgb(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "rgb(var(--primary))",
          foreground: "rgb(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "rgb(var(--secondary))",
          foreground: "rgb(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "rgb(var(--muted))",
          foreground: "rgb(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "rgb(var(--accent))",
          foreground: "rgb(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "rgb(var(--destructive))",
          foreground: "rgb(var(--destructive-foreground))",
        },
        border: "rgb(var(--border))",
        input: "rgb(var(--input))",
        ring: "rgb(var(--ring))",
        
        // Direct color palette access
        "dark-base": "rgb(var(--dark-base))",
        "dark-darker": "rgb(var(--dark-darker))",
        "orange-base": "rgb(var(--orange-base))",
        "orange-light": "rgb(var(--orange-light))",
        "text-primary": "rgb(var(--text-primary))",
        "text-secondary": "rgb(var(--text-secondary))",
        "accent-purple": "rgb(var(--accent-purple))",
        "accent-red": "rgb(var(--accent-red))",
        
        // Chart colors
        chart: {
          "1": "rgb(var(--orange-base))",
          "2": "rgb(var(--orange-light))",
          "3": "rgb(var(--accent-purple))",
          "4": "rgb(var(--text-secondary))",
          "5": "rgb(var(--accent-red))",
        },
        
        // Sidebar specific colors
        sidebar: {
          DEFAULT: "rgb(var(--dark-base))",
          foreground: "rgb(var(--text-primary))",
          primary: "rgb(var(--orange-base))",
          "primary-foreground": "rgb(var(--text-primary))",
          accent: "rgb(var(--accent-purple))",
          "accent-foreground": "rgb(var(--text-primary))",
          border: "rgb(var(--text-secondary))",
          ring: "rgb(var(--orange-base))",
        },
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
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;

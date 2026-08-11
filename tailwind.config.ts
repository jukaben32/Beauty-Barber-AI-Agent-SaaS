import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Warm clinical system: softer surfaces, Sora typography, and a
      // slightly more rounded scale. The existing class names still resolve,
      // so the redesign can be applied mostly through shared components and
      // tokens instead of a full-page rewrite.
      fontFamily: {
        sans: ["Sora", "system-ui", "sans-serif"],
        display: ["Sora", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        brand: {
          50:  "#f5f8fa",
          100: "#eaf0f5",
          200: "#dce6ee",
          300: "#b9cddc",
          400: "#93b0c7",
          500: "#5980a6",
          600: "#3f6482",
          700: "#345268",
          800: "#2a4152",
          900: "#1f313d",
          950: "#16232b",
        },
        accent: {
          50:  "#f5f8fa",
          100: "#eaf0f5",
          200: "#dce6ee",
          300: "#b9cddc",
          400: "#93b0c7",
          500: "#5980a6",
          600: "#3f6482",
          700: "#345268",
        },
        surface: {
          50:  "#f2f2f3",
          100: "#e8e8e9",
          200: "#d8d8d9",
          300: "#b9cddc",
          400: "#93b0c7",
          500: "#5980a6",
          600: "#3f6482",
          700: "#345268",
          800: "#2a4152",
          900: "#1f313d",
        },
      },
      borderRadius: {
        DEFAULT: "0px",
        sm:  "0px",
        md:  "0px",
        lg:  "0px",
        xl:  "0px",
        "2xl": "0px",
        "3xl": "0px",
      },
      boxShadow: {
        xs:       "1px 1px 0 0 rgb(89 128 166 / 0.14)",
        soft:     "2px 2px 0 0 rgb(216 216 217 / 1)",
        card:     "2px 2px 0 0 rgb(216 216 217 / 1)",
        elevated: "3px 3px 0 0 rgb(216 216 217 / 1)",
        "glow-teal":    "2px 2px 0 0 rgb(89 128 166 / 1)",
        "glow-teal-lg": "3px 3px 0 0 rgb(89 128 166 / 1)",
        "glow-green":   "0 0 0 2px rgb(89 128 166 / 0.2)",
        "inner-teal":   "inset 0 1px 0 rgb(89 128 166 / 0.12)",
        dropdown: "2px 2px 0 0 rgb(216 216 217 / 1)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow":  "spin 3s linear infinite",
        "wave":       "wave 1.2s ease-in-out infinite",
        "glow":       "glow 2s ease-in-out infinite",
        "float":      "float 6s ease-in-out infinite",
        "slide-in":   "slideIn 0.25s ease-out",
        "fade-up":    "fadeUp 0.35s ease-out both",
        "shimmer":    "shimmer 1.6s linear infinite",
        "pop-in":     "popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      },
      keyframes: {
        wave:   { "0%, 100%": { transform: "scaleY(1)" },   "50%": { transform: "scaleY(2)" } },
        glow:   { "0%, 100%": { boxShadow: "0 0 20px rgb(20 168 181 / 0.2)" }, "50%": { boxShadow: "0 0 36px rgb(20 168 181 / 0.45)" } },
        float:  { "0%, 100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-8px)" } },
        slideIn:{ from: { opacity: "0", transform: "translateX(-6px)" }, to: { opacity: "1", transform: "translateX(0)" } },
        fadeUp: { from: { opacity: "0", transform: "translateY(10px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        shimmer:{ "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        popIn:  { from: { opacity: "0", transform: "scale(0.92)" }, to: { opacity: "1", transform: "scale(1)" } },
      },
      backdropBlur: { xs: "2px" },
      spacing: { "62": "15.5rem", "72": "18rem" },
    },
  },
  plugins: [],
};

export default config;

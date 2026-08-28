/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Layered zinc canvas (maps legacy dark-* tokens to SaaS palette)
        dark: {
          950: "#09090b", // zinc-950 — app canvas
          900: "#18181b", // zinc-900 — cards / panels
          800: "#27272a", // zinc-800 — elevated surfaces
          700: "#3f3f46", // zinc-700 — borders / hover
          600: "#52525b", // zinc-600 — muted chrome
        },
        brand: {
          light: "#a5b4fc",   // indigo-300
          DEFAULT: "#6366f1", // indigo-500
          dark: "#4f46e5",    // indigo-600
          glow: "rgba(99, 102, 241, 0.12)",
        },
        accent: {
          light: "#c4b5fd",   // violet-300
          DEFAULT: "#8b5cf6", // violet-500
          dark: "#7c3aed",    // violet-600
          glow: "rgba(139, 92, 246, 0.12)",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      boxShadow: {
        "inner-highlight": "inset 0 1px 0 rgba(255, 255, 255, 0.2)",
        "card": "0 0 0 1px rgba(255, 255, 255, 0.06), 0 8px 40px rgba(0, 0, 0, 0.35)",
        "card-hover": "0 0 0 1px rgba(99, 102, 241, 0.15), 0 12px 48px rgba(0, 0, 0, 0.4)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.2s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      transitionTimingFunction: {
        snappy: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

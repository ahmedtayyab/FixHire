/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class", // We'll force dark mode by default on the landing page/dashboard
  theme: {
    extend: {
      colors: {
        // High-end premium SaaS dark theme colors
        dark: {
          950: "#030712", // Purest dark
          900: "#0B0F19", // Deep space midnight blue
          800: "#161B26", // Card background
          700: "#222B3C", // Light borders/hover states
          600: "#4B5563", // Gray details
        },
        brand: {
          light: "#A5B4FC", // Indigo 300
          DEFAULT: "#6366F1", // Indigo 500
          dark: "#4F46E5", // Indigo 600
          glow: "rgba(99, 102, 241, 0.15)",
        },
        accent: {
          light: "#F472B6", // Pink 400
          DEFAULT: "#EC4899", // Pink 500
          dark: "#DB2777", // Pink 600
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}

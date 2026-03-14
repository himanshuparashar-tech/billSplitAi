import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17346f",
        mist: "#f4f8ff",
        brand: {
          DEFAULT: "#59c14f",
          dark: "#2f8f3b",
          soft: "#e7f8e3"
        },
        accent: {
          DEFAULT: "#2f63b5",
          dark: "#1f4c93",
          soft: "#e5efff"
        },
        sand: "#edf4ff"
      },
      boxShadow: {
        panel: "0 24px 60px -28px rgba(23, 52, 111, 0.28)"
      },
      backgroundImage: {
        "grid-fade": "linear-gradient(to right, rgba(47,99,181,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(89,193,79,0.08) 1px, transparent 1px)",
        "brand-hero": "linear-gradient(135deg, #17346f 0%, #2454a2 48%, #59c14f 100%)",
        "brand-hero-dark": "linear-gradient(135deg, #020617 0%, #0f172a 42%, #17346f 72%, #2f8f3b 100%)"
      }
    }
  },
  plugins: []
};

export default config;


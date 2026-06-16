import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "sans-serif"],
      },
      colors: {
        circle: {
          // Couleurs structurelles : pilotées par variables CSS (thème clair/sombre)
          bg: "rgb(var(--c-bg) / <alpha-value>)",
          card: "rgb(var(--c-card) / <alpha-value>)",
          border: "rgb(var(--c-border) / <alpha-value>)",
          frost: "rgb(var(--c-frost) / <alpha-value>)",
          text: "rgb(var(--c-text) / <alpha-value>)",
          // Accents : identiques dans les deux thèmes
          amber: "#ff9f1c",
          honey: "#ffbf69",
          teal: "#2ec4b6",
        },
      },
    },
  },
  plugins: [],
};

export default config;

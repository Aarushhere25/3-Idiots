import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        blush: "#f9d5d3",
        peach: "#ffd6ad",
        lilac: "#d9c2ff",
        ink: "#172036",
        cream: "#fffaf8",
        candy: "#f8c5f0",
        shell: "#fff5fb"
      },
      boxShadow: {
        glow: "0 20px 60px rgba(118, 78, 145, 0.12)",
        bubble: "0 12px 35px rgba(245, 183, 177, 0.18)"
      },
      fontFamily: {
        sans: ["Trebuchet MS", "Avenir Next", "Segoe UI", "sans-serif"],
        display: ["Trebuchet MS", "Avenir Next", "Segoe UI", "sans-serif"]
      },
      backgroundImage: {
        dreamy: "linear-gradient(120deg, #ffd7af 0%, #f8d4d9 48%, #d9c2ff 100%)"
      }
    }
  },
  plugins: []
};

export default config;

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary, #0D2E5E)",
        accent: "var(--color-accent, #C9A84C)",
        background: "#F4F6F9",
        surface: "#FFFFFF",
        success: "#1A7A4A",
        warning: "#E07B2A",
        danger: "#C0392B",
        "text-main": "#1E2A3A",
        "text-muted": "#6B7A8D",
      },
      fontFamily: {
        title: ["Raleway", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

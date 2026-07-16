/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Enlazamos la clase de Tailwind con nuestra variable inyectada.
        // El segundo valor es un fallback de seguridad (Azul corporativo).
        primary: "var(--color-primary, #0D2E5E)",
      },
    },
  },
  plugins: [],
};

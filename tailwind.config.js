/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./app/**/*.{js,ts,jsx,tsx,mdx}",
      "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
      extend: {
        colors: {
          brand: {
            50:  "#f2effa",
            100: "#e6e0f5",
            200: "#cdc0eb",
            300: "#af9bdd",
            400: "#8b71cd",
            500: "#6f56b9",   // main button accent
            600: "#5c4a8a",   // your mock background
            700: "#4d3f78",
            800: "#3a2f5b",
            900: "#2a2242",
          },
        },
        borderRadius: {
          '2xl': '1rem',
          '3xl': '1.25rem',
        },
      },
    },
    plugins: [],
  };
  
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: "#00563F",
          deep: "#003D2C",
          50: "#E8F3EF",
        },
        parchment: "#F6F4EE",
        ink: "#172420",
        brass: {
          DEFAULT: "#C98A2C",
          50: "#FBF1DF",
        },
        line: "#DCD7C9",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

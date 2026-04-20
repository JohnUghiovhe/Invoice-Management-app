/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"]
      },
      colors: {
        brand: {
          50: "#f3f1ff",
          100: "#e4dfff",
          200: "#cbc4ff",
          300: "#aea0ff",
          400: "#9277ff",
          500: "#7c5dfa",
          600: "#6e50eb",
          700: "#5e43d1",
          800: "#4d38aa",
          900: "#3f2f85"
        },
        ink: {
          50: "#f8f8fb",
          100: "#eef0ff",
          200: "#dfe3fa",
          300: "#b7bedb",
          400: "#888eb0",
          500: "#7e88c3",
          600: "#252945",
          700: "#1e2139",
          800: "#141625",
          900: "#0c0e16"
        },
        danger: {
          100: "#ffe6e6",
          200: "#ffc7c7",
          300: "#ff9797",
          400: "#f56f6f",
          500: "#ec5757",
          600: "#d64545",
          700: "#b63a3a"
        }
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        rise: "rise 350ms ease-out"
      }
    }
  },
  plugins: []
};

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef7f6",
          100: "#d7ecea",
          500: "#0e7c74",
          600: "#0b645e",
          700: "#0a534e",
        },
      },
    },
  },
  plugins: [],
};

export default config;

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        rebel: {
          50: "#ecfdf5",
          100: "#d1fae5",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          900: "#064e3b"
        }
      },
      boxShadow: {
        glow: "0 0 35px rgba(16,185,129,.12)"
      }
    }
  },
  plugins: [],
};

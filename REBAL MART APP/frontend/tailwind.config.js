/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['class', '[data-theme="dark"]'],
    content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            colors: {
                rebel: {
                    50: "#fffbeb",
                    100: "#fef3c7",
                    200: "#fde68a",
                    300: "#fcd34d",
                    400: "#fbbf24",
                    500: "#f59e0b",
                    600: "#d97706",
                    700: "#b45309",
                    800: "#92400e",
                    900: "#78350f",
                    950: "#451a03",
                },
                cinema: {
                    dark: "#09090b",
                    surface: "#121217",
                    card: "#181820",
                    border: "#272732",
                    gold: "#d97706",
                    goldLight: "#fbbf24",
                    crimson: "#e11d48",
                    crimsonDark: "#9f1239",
                }
            },
            boxShadow: {
                glow: "0 0 35px rgba(245, 158, 11, 0.22)",
                crimson: "0 0 35px rgba(225, 29, 72, 0.22)",
                card: "0 10px 30px -10px rgba(0, 0, 0, 0.4)",
                cardHover: "0 20px 40px -15px rgba(245, 158, 11, 0.2)",
            },
            fontFamily: {
                sans: ['"Inter"', 'system-ui', 'sans-serif'],
                display: ['"Playfair Display"', 'Georgia', 'serif'],
            }
        }
    },
    plugins: [],
};


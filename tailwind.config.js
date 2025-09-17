import defaultTheme from "tailwindcss/defaultTheme";
import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php",
        "./storage/framework/views/*.php",
        "./resources/views/**/*.blade.php",
        "./resources/js/**/*.tsx",
    ],

    darkMode: "class",

    theme: {
        extend: {
            fontFamily: {
                sans: ["Inter", ...defaultTheme.fontFamily.sans],
                display: ["Lexend", ...defaultTheme.fontFamily.sans],
            },
            colors: {
                primary: {
                    50: "#e6f1ff",
                    100: "#b3d7ff",
                    200: "#80bdff",
                    300: "#4da3ff",
                    400: "#1a89ff",
                    500: "#0070f3", // Main primary color
                    600: "#005ac2",
                    700: "#004391",
                    800: "#002d60",
                    900: "#001730",
                },
            },
        },
        keyframes: {
            "fade-in-down": {
                "0%": {
                    opacity: "0",
                    transform: "translateY(-10px)",
                },
                "100%": {
                    opacity: "1",
                    transform: "translateY(0)",
                },
            },
        },
        animation: {
            "fade-in-down": "fade-in-down 0.3s ease-out",
        },
    },

    plugins: [forms, typography, require("tailwindcss-animate")],
};

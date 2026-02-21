/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#FFD41D",
                secondary: "#FFA240",
                accent: "#FF4646",
                danger: "#D73535",
                bg: "#F8FAFC",
                card: "#FFFFFF",
                textMain: "#111827",
                textSecondary: "#6B7280",
                borderColor: "#E5E7EB",
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}

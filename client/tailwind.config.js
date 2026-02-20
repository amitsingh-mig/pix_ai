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
                textMain: "#0F172A",
                textSecondary: "#64748B",
                borderColor: "#E2E8F0",
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}

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
                glass: "rgba(255, 255, 255, 0.7)",
            },
            fontFamily: {
                sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                'premium': '0 20px 40px -15px rgba(0, 0, 0, 0.05)',
                'active': '0 10px 25px -5px rgba(255, 212, 29, 0.3)',
            },
            borderRadius: {
                '3xl': '2rem',
                '4xl': '2.5rem',
            }
        },
    },
    plugins: [],
}

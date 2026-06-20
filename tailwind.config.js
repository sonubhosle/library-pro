/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                background: 'var(--background)',
                surface: 'var(--surface)',
                card: 'var(--card)',
                border: 'var(--border)',
                accent: 'var(--accent)',
                success: 'var(--success)',
                warning: 'var(--warning)',
                danger: 'var(--danger)',
                gold: 'var(--gold)',
                text: 'var(--text)',
                muted: 'var(--muted)',
            },
            fontFamily: {
                sans: ['"Segoe UI"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
            },
            animation: {
                'slide-in': 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                'fade-in': 'fadeIn 0.2s ease-in-out',
                'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            },
            keyframes: {
                slideIn: {
                    '0%': { transform: 'translateY(15px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}

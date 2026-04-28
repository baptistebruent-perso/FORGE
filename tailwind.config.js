/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0A0A0B',
        surface: '#141416',
        border: '#222226',
        text: '#FAFAFA',
        muted: '#8A8A92',
        accent: '#B4FF39',
        'accent-orange': '#FF6B35',
        error: '#FF4757',
        success: '#39FF88',
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        modal: '16px',
      },
    },
  },
  plugins: [],
}

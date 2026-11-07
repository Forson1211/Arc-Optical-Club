/** @type {import('tailwindcss').Config} */
export default {
  content: {
    relative: true,
    files: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  },
  theme: {
    extend: {
      colors: {
        arc: {
          deep: '#10394B',
          ice: '#F0FFFF',
          blue: '#026AAB',
          yellow: '#FEBE01',
          navy: '#142B3B',
          slate: '#64748B',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 18px 55px rgba(2, 55, 82, 0.09)',
      },
    },
  },
  plugins: [],
}

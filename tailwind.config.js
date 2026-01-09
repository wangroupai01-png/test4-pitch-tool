/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7F5AF0', // Vivid Purple
          hover: '#6644C0',
        },
        secondary: {
          DEFAULT: '#2CB67D', // Fresh Green
          hover: '#249665',
        },
        accent: {
          DEFAULT: '#FF8906', // Bright Orange
          hover: '#E57A00',
        },
        dark: '#16161a',
        background: '#FFFFFE', // Pure white, but we will use a colorful grid
        surface: '#FFFFFE',
        'light-bg': '#E3F2FD', // Light Blue for page background
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'neo': '4px 4px 0px 0px rgba(22, 22, 26, 1)', // Darker shadow color
        'neo-sm': '2px 2px 0px 0px rgba(22, 22, 26, 1)',
        'neo-lg': '8px 8px 0px 0px rgba(22, 22, 26, 1)',
      },
      borderWidth: {
        '3': '3px',
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
      }
    },
  },
  plugins: [],
}

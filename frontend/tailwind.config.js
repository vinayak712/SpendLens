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
        primary: {
          50:  '#eff4ff',
          100: '#dbe1ff',
          200: '#b4c5ff',
          300: '#8baeff',
          400: '#5b8fff',
          500: '#2563eb',
          600: '#004ac6',
          700: '#003ea8',
          800: '#002d7a',
          900: '#00174b',
        },
        surface: {
          DEFAULT: '#f8f9ff',
          dim:     '#cbdbf5',
          bright:  '#f8f9ff',
          low:     '#eff4ff',
          mid:     '#e5eeff',
          high:    '#dce9ff',
          highest: '#d3e4fe',
        },
        ink: {
          DEFAULT: '#0b1c30',
          muted:   '#434655',
          subtle:  '#737686',
        },
        success: '#10b981',
        danger:  '#ef4444',
        warning: '#f59e0b',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm:  '0.25rem',
        DEFAULT: '0.5rem',
        md:  '0.75rem',
        lg:  '1rem',
        xl:  '1.5rem',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(0,0,0,0.05)',
        hover: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
        modal: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [],
}

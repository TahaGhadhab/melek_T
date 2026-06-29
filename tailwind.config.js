/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Blue (accent principal)
        'blue-50': '#E6F1FB',
        'blue-100': '#B5D4F4',
        'blue-200': '#85B7EB',
        'blue-400': '#378ADD',
        'blue-600': '#185FA5',
        'blue-800': '#0C447C',
        'blue-900': '#042C53',
        // Red (urgence)
        'red-50': '#FCEBEB',
        'red-100': '#F7C1C1',
        'red-200': '#F09595',
        'red-400': '#E24B4A',
        'red-600': '#A32D2D',
        'red-800': '#791F1F',
        'red-900': '#501313',
        // Amber (warning)
        'amber-50': '#FAEEDA',
        'amber-100': '#FAC775',
        'amber-200': '#EF9F27',
        'amber-400': '#BA7517',
        'amber-600': '#854F0B',
        'amber-800': '#633806',
        'amber-900': '#412402',
        // Green (succès)
        'green-50': '#EAF3DE',
        'green-100': '#C0DD97',
        'green-200': '#97C459',
        'green-400': '#639922',
        'green-600': '#3B6D11',
        'green-800': '#27500A',
        'green-900': '#173404',
        // Gray (neutre)
        'gray-50': '#F1EFE8',
        'gray-100': '#D3D1C7',
        'gray-200': '#B4B2A9',
        'gray-400': '#888780',
        'gray-600': '#5F5E5A',
        'gray-800': '#444441',
        'gray-900': '#2C2C2A',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
        '2xl': '32px',
      },
      borderRadius: {
        'DEFAULT': '8px',
        'card': '12px',
        'sm': '6px',
        'full': '50%',
      },
      transitionDuration: {
        'fast': '150ms',
        'snap': '200ms',
        'base': '250ms',
        'slow': '350ms',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'overshoot': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}

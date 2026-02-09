/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,tsx}', './components/**/*.{js,ts,tsx}'],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#E23744',
        success: '#22C55E',
        background: '#ffffff',
        darkText: '#1C1C1C',
        secondaryText: '#6B7280',
        border: '#E5E7EB',
      },
      fontFamily: {
        sans: ['PlusJakartaSans-Regular'],
        medium: ['PlusJakartaSans-Medium'],
        semibold: ['PlusJakartaSans-SemiBold'],
        bold: ['PlusJakartaSans-Bold'],
      },
      fontSize: {
        base: '16px',
        sm: '14px',
        lg: '18px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '28px',
        '4xl': '32px',
      },
      lineHeight: {
        base: '20px',
        sm: '18px',
        lg: '22px',
        xl: '24px',
        '2xl': '28px',
        '3xl': '32px',
        '4xl': '36px',
      },
    },
  },
  plugins: [],
};

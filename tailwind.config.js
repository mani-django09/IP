module.exports = {
  content: [
    './ip_app/templates/**/*.html',
    './ip_app/static/**/*.js',
    './templates/**/*.html',  // Add this if you have templates in the root directory
    './static/**/*.js',       // Add this if you have static files in the root directory
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#1b4a6b', // Your current primary color
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        secondary: {
          DEFAULT: '#2a9fd6', // Your current secondary color
          50: '#f0f9fe',
          100: '#dcf1fc',
          200: '#b9e3f9',
          300: '#81cff5',
          400: '#41b5eb',
          500: '#2a9fd6', // Base color
          600: '#1677b3',
          700: '#145f91',
          800: '#144f77',
          900: '#164264',
          950: '#0e2a42',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-slow': 'bounce 3s infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
      },
      boxShadow: {
        'inner-lg': 'inset 0 2px 10px 0 rgba(0, 0, 0, 0.05)',
      },
      spacing: {
        '18': '4.5rem',
        '68': '17rem',
        '84': '21rem',
        '96': '24rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
      },
      transitionDuration: {
        '400': '400ms',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.gray.800'),
            a: {
              color: theme('colors.secondary.DEFAULT'),
              '&:hover': {
                color: theme('colors.secondary.600'),
              },
            },
          },
        },
      }),
    },
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1F2937',
        secondary: '#3B82F6',
        accent: '#10B981',
        danger: '#EF4444',
        warning: '#F59E0B',
        daoblue: '#0200e1',
        daolight: '#d7dbec',
        // Landing Page Colors
        'dao-blue': '#0b7ef1',
        'dao-blue-dark': '#04338C',
        'dao-blue-light': '#15459b',
        'dao-lime': '#AEFE3A',
        'dao-dark': '#1b1b1b',
        'dao-gray': '#666666',
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #0b7ef1 0%, #15459b 100%)',
      },
    },
  },
  plugins: [],
};

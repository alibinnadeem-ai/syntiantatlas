/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
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
}

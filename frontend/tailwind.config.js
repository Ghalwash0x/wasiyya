/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],
    theme: {
        extend: {
            fontFamily: {
                arabic: ['Cairo', 'Tajawal', 'sans-serif']
            },
            colors: {
                slate: {
                    850: '#1a2235',
                }
            }
        }
    },
    plugins: []
};

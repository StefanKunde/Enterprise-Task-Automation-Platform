module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  theme: {
    extend: {
      keyframes: {
        popIn: {
          '0%': { opacity: 0, transform: 'scale(0.8) translateY(10px)' },
          '100%': { opacity: 1, transform: 'scale(1) translateY(0)' },
        },
      },
      animation: {
        'pop-in': 'popIn 0.5s ease-out forwards',
      },
    },
  },
};

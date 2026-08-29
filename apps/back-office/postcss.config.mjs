/**
 * Tailwind CSS v4 s installe comme un simple plugin PostCSS.
 * Il n y a volontairement pas de tailwind.config.js : depuis la v4, le theme
 * se configure directement en CSS (voir src/app/globals.css).
 */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;

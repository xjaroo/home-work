import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Resolve Tailwind config from this file's directory so `content` works when Vite's cwd is elsewhere (e.g. server package). */
export default {
  plugins: {
    tailwindcss: {
      config: path.join(__dirname, 'tailwind.config.js'),
    },
    autoprefixer: {},
  },
};

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {fileURLToPath} from 'url';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const rootDir = import.meta.dirname ?? path.dirname(fileURLToPath(import.meta.url));

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(rootDir, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      origin: 'https://ais-dev-v24ydvjkr7k3gbns26ecmk-727009405222.europe-west2.run.app',
      allowedHosts: [
        '0.0.0.0',
        'ais-dev-v24ydvjkr7k3gbns26ecmk-727009405222.europe-west2.run.app',
        'ais-pre-v24ydvjkr7k3gbns26ecmk-727009405222.europe-west2.run.app',
        'localhost',
        '127.0.0.1',
      ],
      cors: true,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

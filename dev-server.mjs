import { createServer } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';

const server = await createServer({
  configFile: './vite.config.mjs',
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: [
      'all',
      '.replit.dev',
      '.repl.co'
    ],
    hmr: {
      port: 5001
    }
  }
});

await server.listen();
server.printUrls();

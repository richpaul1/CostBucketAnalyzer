import { createServer } from 'vite';

const server = await createServer({
  configFile: './vite.config.mjs'
});

await server.listen();
server.printUrls();

import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [sveltekit()],
    server: {
        host: '0.0.0.0',
        port: 5000,
        allowedHosts: [
            'all',
            '.replit.dev',
            '.repl.co'
        ]
    },
    optimizeDeps: {
        include: ['lucide-svelte']
    }
});

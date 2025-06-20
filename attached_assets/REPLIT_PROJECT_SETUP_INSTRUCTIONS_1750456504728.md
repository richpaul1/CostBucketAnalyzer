# Replit SvelteKit Project Setup Instructions

## Step 1: Create New Replit Project

1. Go to Replit.com and create a new Repl
2. Choose "Node.js" as the template
3. Name your project (e.g., "my-sveltekit-app")

## Step 2: Install Dependencies

Run these commands in the Replit shell:

```bash
# Install core SvelteKit dependencies
npm install @sveltejs/kit@^2.22.0 @sveltejs/adapter-node@^5.2.12 @sveltejs/vite-plugin-svelte@^5.1.0 svelte@^5.34.7 vite@^6.3.5

# Install UI dependencies
npm install lucide-svelte@^0.519.0 express
```

## Step 3: Create Configuration Files

### Create `svelte.config.mjs`:
```javascript
import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    kit: {
        adapter: adapter({
            out: 'build',
            precompress: false,
            envPrefix: ''
        })
    }
};

export default config;
```

### Create `vite.config.mjs`:
```javascript
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
```

### Create `dev-server.mjs`:
```javascript
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
```

## Step 4: Create Project Structure

Create these folders and files:

```bash
# Create directory structure
mkdir -p src/lib/components
mkdir -p src/lib/stores
mkdir -p src/routes/upload
mkdir -p src/routes/graph-rules
mkdir -p static
```

## Step 5: Create Core Files

### Create `src/app.css`:
```css
:root {
    --bg-primary: #ffffff;
    --bg-secondary: #f8fafc;
    --text-primary: #1e293b;
    --text-secondary: #64748b;
    --border-color: #e2e8f0;
    --accent-color: #3b82f6;
    --success-color: #10b981;
    --warning-color: #f59e0b;
    --error-color: #ef4444;
}

[data-theme='dark'] {
    --bg-primary: #0f172a;
    --bg-secondary: #1e293b;
    --text-primary: #f1f5f9;
    --text-secondary: #94a3b8;
    --border-color: #334155;
    --accent-color: #60a5fa;
    --success-color: #34d399;
    --warning-color: #fbbf24;
    --error-color: #f87171;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: system-ui, -apple-system, sans-serif;
    background-color: var(--bg-primary);
    color: var(--text-primary);
    line-height: 1.6;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
}

.btn {
    background-color: var(--accent-color);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s ease;
}

.btn:hover {
    opacity: 0.9;
    transform: translateY(-1px);
}

@media (max-width: 768px) {
    .container {
        padding: 0 0.75rem;
    }
}
```

### Create `src/app.html`:
```html
<!doctype html>
<html lang="en" data-theme="light">
    <head>
        <meta charset="utf-8" />
        <link rel="icon" href="%sveltekit.assets%/favicon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        %sveltekit.head%
    </head>
    <body data-sveltekit-preload-data="hover">
        <div style="display: contents">%sveltekit.body%</div>
    </body>
</html>
```

### Create `src/lib/stores/theme.js`:
```javascript
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createThemeStore() {
    const { subscribe, set, update } = writable('light');
    
    return {
        subscribe,
        toggle: () => update(theme => {
            const newTheme = theme === 'light' ? 'dark' : 'light';
            if (browser) {
                localStorage.setItem('theme', newTheme);
                document.documentElement.setAttribute('data-theme', newTheme);
            }
            return newTheme;
        }),
        init: () => {
            if (browser) {
                const stored = localStorage.getItem('theme');
                const theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                document.documentElement.setAttribute('data-theme', theme);
                set(theme);
            }
        }
    };
}

export const theme = createThemeStore();
```

### Create `src/lib/components/ThemeToggle.svelte`:
```svelte
<script>
    import { theme } from '$lib/stores/theme';
    import { Sun, Moon } from 'lucide-svelte';
</script>

<button class="theme-toggle" on:click={theme.toggle} aria-label="Toggle theme">
    {#if $theme === 'light'}
        <Moon size={20} />
    {:else}
        <Sun size={20} />
    {/if}
</button>

<style>
    .theme-toggle {
        background: none;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        padding: 0.5rem;
        cursor: pointer;
        color: var(--text-primary);
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .theme-toggle:hover {
        background-color: var(--bg-secondary);
        border-color: var(--accent-color);
    }
</style>
```

### Create `src/lib/components/Header.svelte`:
```svelte
<script>
    import ThemeToggle from './ThemeToggle.svelte';
</script>

<header class="header">
    <div class="container">
        <div class="header-content">
            <h1 class="brand">Your App Name</h1>
            <ThemeToggle />
        </div>
    </div>
</header>

<style>
    .header {
        background-color: var(--bg-primary);
        border-bottom: 1px solid var(--border-color);
        position: sticky;
        top: 0;
        z-index: 100;
    }
    
    .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 0;
    }
    
    .brand {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--accent-color);
    }
</style>
```

### Create `src/lib/components/Sidebar.svelte`:
```svelte
<script>
    import { page } from '$app/stores';
    import { Home, Upload, BarChart3 } from 'lucide-svelte';
    
    const navItems = [
        { path: '/', label: 'Dashboard', icon: Home },
        { path: '/upload', label: 'Upload', icon: Upload },
        { path: '/analytics', label: 'Analytics', icon: BarChart3 }
    ];
</script>

<aside class="sidebar">
    <nav class="nav">
        {#each navItems as item}
            <a 
                href={item.path} 
                class="nav-item"
                class:active={$page.url.pathname === item.path}
            >
                <svelte:component this={item.icon} size={20} />
                <span>{item.label}</span>
            </a>
        {/each}
    </nav>
</aside>

<style>
    .sidebar {
        background-color: var(--bg-secondary);
        border-right: 1px solid var(--border-color);
        width: 250px;
        height: 100vh;
        position: fixed;
        left: 0;
        top: 0;
        padding: 1rem 0;
        overflow-y: auto;
    }
    
    .nav {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 0 1rem;
    }
    
    .nav-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        border-radius: 6px;
        text-decoration: none;
        color: var(--text-secondary);
        transition: all 0.2s ease;
    }
    
    .nav-item:hover,
    .nav-item.active {
        background-color: var(--accent-color);
        color: white;
    }
    
    @media (max-width: 768px) {
        .sidebar {
            transform: translateX(-100%);
            transition: transform 0.3s ease;
        }
    }
</style>
```

### Create `src/routes/+layout.svelte`:
```svelte
<script>
    import '../app.css';
    import { onMount } from 'svelte';
    import { theme } from '$lib/stores/theme';
    import Header from '$lib/components/Header.svelte';
    import Sidebar from '$lib/components/Sidebar.svelte';
    
    onMount(() => {
        theme.init();
    });
</script>

<div class="app">
    <Header />
    <div class="app-body">
        <Sidebar />
        <main class="main-content">
            <slot />
        </main>
    </div>
</div>

<style>
    .app {
        min-height: 100vh;
        background-color: var(--bg-primary);
    }
    
    .app-body {
        display: flex;
    }
    
    .main-content {
        flex: 1;
        margin-left: 250px;
        padding: 2rem;
        min-height: calc(100vh - 80px);
    }
    
    @media (max-width: 768px) {
        .main-content {
            margin-left: 0;
            padding: 1rem;
        }
    }
</style>
```

### Create `src/routes/+page.svelte`:
```svelte
<script>
    import { Home, Upload, BarChart3 } from 'lucide-svelte';
</script>

<div class="dashboard">
    <h1>Welcome to Your App</h1>
    <p>Get started by exploring the features below.</p>
    
    <div class="feature-grid">
        <div class="feature-card">
            <div class="feature-icon">
                <Upload size={32} />
            </div>
            <h3>Upload Data</h3>
            <p>Upload your files and data to get started.</p>
            <a href="/upload" class="btn">Go to Upload</a>
        </div>
        
        <div class="feature-card">
            <div class="feature-icon">
                <BarChart3 size={32} />
            </div>
            <h3>View Analytics</h3>
            <p>Analyze your data with powerful visualizations.</p>
            <a href="/analytics" class="btn">View Analytics</a>
        </div>
    </div>
</div>

<style>
    .dashboard {
        max-width: 800px;
    }
    
    .dashboard h1 {
        font-size: 2.5rem;
        margin-bottom: 1rem;
        color: var(--text-primary);
    }
    
    .dashboard p {
        font-size: 1.125rem;
        color: var(--text-secondary);
        margin-bottom: 2rem;
    }
    
    .feature-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 2rem;
        margin-top: 2rem;
    }
    
    .feature-card {
        background-color: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 2rem;
        text-align: center;
        transition: all 0.2s ease;
    }
    
    .feature-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .feature-icon {
        color: var(--accent-color);
        margin-bottom: 1rem;
    }
    
    .feature-card h3 {
        margin-bottom: 0.5rem;
        color: var(--text-primary);
    }
    
    .feature-card p {
        color: var(--text-secondary);
        margin-bottom: 1.5rem;
    }
</style>
```

### Create `src/routes/upload/+page.svelte`:
```svelte
<script>
    import { Upload } from 'lucide-svelte';
</script>

<div class="upload-page">
    <h1>Upload Data</h1>
    <p>Upload your files to get started with analysis.</p>
    
    <div class="upload-area">
        <Upload size={48} />
        <h3>Drag and drop your files here</h3>
        <p>or click to browse</p>
        <input type="file" multiple accept=".csv,.json,.xlsx" />
    </div>
</div>

<style>
    .upload-page h1 {
        margin-bottom: 0.5rem;
    }
    
    .upload-page p {
        color: var(--text-secondary);
        margin-bottom: 2rem;
    }
    
    .upload-area {
        border: 2px dashed var(--border-color);
        border-radius: 8px;
        padding: 3rem;
        text-align: center;
        background-color: var(--bg-secondary);
        position: relative;
        cursor: pointer;
        transition: all 0.2s ease;
    }
    
    .upload-area:hover {
        border-color: var(--accent-color);
    }
    
    .upload-area input {
        position: absolute;
        inset: 0;
        opacity: 0;
        cursor: pointer;
    }
    
    .upload-area h3 {
        margin: 1rem 0 0.5rem;
        color: var(--text-primary);
    }
    
    .upload-area p {
        color: var(--text-secondary);
        margin: 0;
    }
</style>
```

## Step 6: Configure Replit Runner

Create or edit the `.replit` file:
```
run = "node dev-server.mjs"
hidden = [".svelte-kit", "build", "node_modules"]

[nix]
channel = "stable-24_05"

[deployment]
run = ["sh", "-c", "npx vite build && node build/index.js"]
```

## Step 7: Start the Development Server

In the Replit shell, run:
```bash
node dev-server.mjs
```

## Step 8: Fix Host Blocking (If Needed)

If you see "Blocked request" errors, update your `vite.config.mjs` and add your specific Replit domain:

```javascript
allowedHosts: [
    'all',
    '.replit.dev',
    '.repl.co',
    'your-specific-replit-domain.replit.dev'  // Add your actual domain here
]
```

## Step 9: Test Your Application

1. Check that the server starts without errors
2. Verify the theme toggle works
3. Test navigation between pages
4. Confirm responsive design on mobile view

## Customization Tips

- **Change App Name**: Update "Your App Name" in `Header.svelte`
- **Add New Pages**: Create new folders in `src/routes/`
- **Modify Colors**: Update CSS custom properties in `src/app.css`
- **Add Navigation**: Update the `navItems` array in `Sidebar.svelte`

## Common Issues and Solutions

1. **Host blocking**: Add your Replit domain to allowedHosts
2. **Port conflicts**: Ensure you're using port 5000 consistently
3. **Theme not saving**: Verify localStorage is working in browser
4. **CSS not loading**: Check that `app.css` is imported in layout

Your SvelteKit application template is now ready! You have a modern, responsive web app with dark/light theme support and a professional sidebar navigation system.
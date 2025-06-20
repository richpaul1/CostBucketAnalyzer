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

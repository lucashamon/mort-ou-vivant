import { defineConfig } from 'vite';

export default defineConfig({
    // We let Vite handle file hashing (main.[hash].js) 
    // This is the standard way to ensure browser cache invalidation 
    // for both PWA and non-PWA users.
});
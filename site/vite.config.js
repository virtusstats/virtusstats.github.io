import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Relative base so the built site works from any folder or GitHub Pages path.
export default defineConfig({ plugins: [react(), tailwindcss()], base: './' });

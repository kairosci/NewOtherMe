import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    server: {
        port: 5175,
        open: false,
    },
    base: './',
    build: {
        outDir: 'dist',
        sourcemap: false,
        minify: 'esbuild',
        chunkSizeWarningLimit: 1500,
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ['phaser'],
                    game: [
                        './src/scenes/BootScene.ts',
                        './src/scenes/MenuScene.ts',
                        './src/scenes/GameScene.ts',
                        './src/scenes/BaseScene.ts'
                    ]
                },
            },
        },
    },
});

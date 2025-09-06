import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
	plugins: [
		sveltekit(),
		SvelteKitPWA({
			srcDir: './src',
			mode: 'development',
			strategies: 'injectManifest',
			filename: 'app-sw.js',
			scope: '/',
			base: '/',
			manifest: {
				short_name: 'Branchboard',
				name: 'Branchboard - Personal Strategy Cockpit',
				description: 'A personal strategy cockpit PWA - tracks your world, maps possible futures, and turns branching scenarios into scheduled tasks',
				start_url: '/',
				display: 'standalone',
				theme_color: '#1f2937',
				background_color: '#ffffff',
				icons: [
					{
						src: '/icon.svg',
						sizes: '192x192',
						type: 'image/svg+xml'
					},
					{
						src: '/icon.svg',
						sizes: '512x512',
						type: 'image/svg+xml'
					}
				]
			},
			injectManifest: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}']
			},
			devOptions: {
				enabled: true,
				type: 'module'
			}
		})
	]
});
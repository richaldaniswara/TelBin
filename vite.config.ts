import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
	plugins: [
		tailwindcss(), 
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			manifest: {
				name: 'Test App',
				short_name: 'Test',
				start_url: '/',
				display: 'standalone',
				theme_color: '#3b82f6',
				background_color: '#ffffff',
				icons: [
					{
						src: '/favicon.svg',
						sizes: '192x192 512x512',
						type: 'image/svg+xml'
					}
				]
			}
		})
	]
});
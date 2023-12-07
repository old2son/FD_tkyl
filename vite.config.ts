import { defineConfig, loadEnv, ConfigEnv, UserConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path'; // 路径

export default defineConfig(({ mode }: ConfigEnv): UserConfig => {
	return {
		base: './',
		resolve: {
			alias: {
				'@': resolve('src'),
			},
		},
		publicDir: resolve('public'),
		mode: mode,
		server: {
			host: '0.0.0.0',
			port: 8080,
			proxy: {
				'/api': {
					target: 'http://localhost:8080',
					changeOrigin: true,
					rewrite: (path) => path.replace(/^\/api/, ''),
				},
			},
		},
		plugins: [vue()],
		build: {
			outDir: 'dist',
			assetsDir: 'static',
			assetsInlineLimit: 10000, // 默认 4096kb
			sourcemap: true,
			rollupOptions: {
				input: {
					main: resolve(__dirname, 'index.html'),
				},
				output: {
					entryFileNames: 'js/entry-[name].js',
					chunkFileNames: 'js/chunk-[name]-[hash].js',
					assetFileNames: assetInfo => {
						let info = assetInfo.name.split('.');
						let extType = info[info.length - 1];

						if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(assetInfo.name)) {
							extType = 'media'
						} 
						else if (/\.(png|jpe?g|gif|svg)(\?.*)?$/.test(assetInfo.name)) {
							extType = 'img'
						}
						else if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name)) {
							extType = 'font'
						}

						return `${extType}/[name]-[hash][extname]`;
					}
				}
			},
			minify: 'terser'
		}
	}
});

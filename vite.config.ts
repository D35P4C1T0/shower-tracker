import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { readFileSync } from 'fs'
import { execSync } from 'child_process'

const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as { version: string }
const appVersion = packageJson.version
const appCommit = process.env.VERCEL_GIT_COMMIT_SHA
  ?? process.env.GITHUB_SHA
  ?? (() => {
    try {
      return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
    } catch {
      return 'dev'
    }
  })()
const appBuildId = `${appVersion}-${appCommit}`
const appVersionMetadata = JSON.stringify({
  version: appVersion,
  commit: appCommit,
  buildId: appBuildId
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Determine base path based on environment
  const base = mode === 'production' && process.env.GITHUB_PAGES 
    ? '/shower-tracker/' 
    : '/'

  return {
    base,
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
      __APP_COMMIT__: JSON.stringify(appCommit),
      __APP_BUILD_ID__: JSON.stringify(appBuildId)
    },
    plugins: [
      react(),
      {
        name: 'app-version-manifest',
        configureServer(server) {
          server.middlewares.use('/version.json', (_request, response) => {
            response.setHeader('Content-Type', 'application/json')
            response.setHeader('Cache-Control', 'no-store')
            response.end(appVersionMetadata)
          })
        },
        generateBundle() {
          this.emitFile({
            type: 'asset',
            fileName: 'version.json',
            source: appVersionMetadata
          })
        }
      },
      VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg', 'notification-sw.js'],
      workbox: {
        importScripts: ['notification-sw.js'],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 5000000, // 5MB
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30 // <== 30 days
              }
            }
          },
          {
            urlPattern: /\.(?:js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // <== 7 days
              }
            }
          }
        ]
      },
      manifest: {
        name: 'Shower Tracker',
        short_name: 'Showers',
        description: 'Track your shower habits with a simple PWA',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: base,
        start_url: base,
        categories: ['health', 'lifestyle', 'utilities'],
        lang: 'en',
        icons: [
          {
            src: 'pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png'
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      devOptions: {
        enabled: true,
        suppressWarnings: true
      }
    })
  ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      // Enable code splitting and optimization
      rollupOptions: {
        output: {
          manualChunks: {
            // Separate vendor chunks for better caching
            vendor: ['react', 'react-dom'],
            ui: ['@radix-ui/react-dropdown-menu', '@radix-ui/react-label', '@radix-ui/react-select', '@radix-ui/react-switch'],
            utils: ['clsx', 'tailwind-merge', 'class-variance-authority'],
            database: ['dexie']
          },
          // Optimize asset naming for better caching
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name?.split('.') || [];
            let extType = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
              extType = 'img';
            } else if (/woff|woff2|eot|ttf|otf/i.test(extType)) {
              extType = 'fonts';
            }
            return `assets/${extType}/[name]-[hash][extname]`;
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js'
        }
      },
      // Enable compression and optimization
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production',
          pure_funcs: mode === 'production' ? ['console.log', 'console.info'] : []
        },
        mangle: {
          safari10: true
        }
      },
      // Generate source maps for debugging
      sourcemap: mode !== 'production',
      // Optimize chunk size
      chunkSizeWarningLimit: 1000,
      // Enable CSS code splitting
      cssCodeSplit: true,
      // Optimize assets
      assetsInlineLimit: 4096,
      // Target modern browsers for better optimization
      target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14']
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom', 'dexie', 'lucide-react']
    }
  }
})

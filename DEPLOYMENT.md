# Deployment Guide

This document outlines how to deploy the Shower Tracker PWA to GitHub Pages and Vercel.

## GitHub Pages Deployment

### Automatic Deployment

The project is configured for automatic deployment to GitHub Pages via GitHub Actions:

1. **Push to main branch** - Triggers the deployment workflow
2. **Tests run** - Both unit tests and E2E tests must pass
3. **Build process** - Creates optimized production build with correct base path
4. **Deploy** - Uploads to GitHub Pages

### Manual Setup

1. Go to your repository Settings → Pages
2. Set Source to "GitHub Actions"
3. The workflow will automatically deploy on the next push to main

### Configuration

- **Base Path**: Automatically set to `/shower-tracker/` for GitHub Pages
- **Build Command**: `npm run build:github`
- **Environment Variable**: `GITHUB_PAGES=true`

## Vercel Deployment

### Automatic Deployment

1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Framework Detection**: Vercel automatically detects Vite configuration
3. **Build Settings**: Uses `vercel.json` configuration
4. **Deploy**: Automatic deployment on every push

### Manual Setup

1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel --prod`

### Configuration

- **Build Command**: `npm run build:vercel`
- **Output Directory**: `dist`
- **Base Path**: Root (`/`)
- **Framework**: Vite (auto-detected)

## Build Optimizations

### Code Splitting

The build is configured with manual chunks for optimal caching:

- **vendor**: React and React DOM
- **ui**: Radix UI components
- **utils**: Utility libraries (clsx, tailwind-merge, etc.)
- **database**: Dexie.js

### Performance Features

- **Terser minification** with console/debugger removal in production
- **Source maps** disabled in production for smaller bundle size
- **Dependency optimization** for faster development
- **Asset compression** and caching headers
- **Service Worker** with workbox for offline functionality

### PWA Optimization

- **Manifest** with proper icons and metadata
- **Service Worker** with caching strategies:
  - Cache-first for static assets and fonts
  - Stale-while-revalidate for JS/CSS
  - Runtime caching for images
- **Offline support** for core functionality

## Environment Variables

### GitHub Pages
- `GITHUB_PAGES=true` - Sets correct base path for repository deployment

### Vercel
- No special environment variables needed
- Uses root path by default

## Testing Deployment

### Local Testing

```bash
# Build and preview locally
npm run build
npm run preview

# Test PWA functionality
npm run test:e2e
```

### Production Testing

1. **Lighthouse Audit**: Check PWA compliance and performance
2. **Cross-browser Testing**: Verify functionality across browsers
3. **Mobile Testing**: Test installation and offline functionality
4. **Performance**: Monitor Core Web Vitals

## Troubleshooting

### GitHub Pages Issues

- **404 Errors**: Check base path configuration in `vite.config.ts`
- **Assets Not Loading**: Verify `GITHUB_PAGES` environment variable
- **Service Worker**: Ensure scope matches base path

### Vercel Issues

- **Build Failures**: Check Node.js version compatibility
- **Routing**: SPA routing handled by `vercel.json` rewrites
- **Headers**: Service worker headers configured for proper caching

### PWA Issues

- **Installation**: Check manifest.webmanifest accessibility
- **Offline**: Verify service worker registration and caching
- **Updates**: Test auto-update functionality

## Monitoring

### GitHub Pages
- Check Actions tab for deployment status
- Monitor via GitHub Pages settings

### Vercel
- Use Vercel dashboard for deployment logs
- Optional: Enable Vercel Analytics for performance monitoring

## Security

- **HTTPS**: Both platforms provide HTTPS by default
- **Headers**: Security headers configured in `vercel.json`
- **Dependencies**: Regular security updates via Dependabot
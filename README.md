# 🚿 Shower Tracker

A modern Progressive Web App (PWA) for tracking your shower habits and maintaining personal hygiene routines.

[![Deploy to GitHub Pages](https://github.com/D35P4C1T0/shower-tracker/actions/workflows/deploy-github-pages.yml/badge.svg)](https://github.com/D35P4C1T0/shower-tracker/actions/workflows/deploy-github-pages.yml)
[![Tests](https://img.shields.io/badge/tests-185%20passing-brightgreen)](https://github.com/D35P4C1T0/shower-tracker)
[![PWA](https://img.shields.io/badge/PWA-ready-blue)](https://web.dev/progressive-web-apps/)

## ✨ Features

### 🎯 Core Functionality
- **One-tap shower recording** - Quick and easy shower logging
- **Calendar view** - Visual history of your shower habits
- **Time tracking** - See how long since your last shower
- **Streak tracking** - Monitor your hygiene consistency

### 📱 PWA Capabilities
- **Installable** - Add to home screen on mobile and desktop
- **Offline support** - Works without internet connection
- **Push notifications** - Customizable shower reminders
- **Cross-platform** - Works on iOS, Android, and desktop

### 🎨 User Experience
- **Dark/Light themes** - Automatic system theme detection
- **Responsive design** - Optimized for all screen sizes
- **Accessibility** - Full keyboard navigation and screen reader support
- **Fast loading** - Optimized performance with code splitting

## 🚀 Live Demo

**GitHub Pages**: [https://d35p4c1t0.github.io/shower-tracker/](https://d35p4c1t0.github.io/shower-tracker/)

## 📱 Installation

### Mobile (iOS/Android)
1. Visit the web app in your browser
2. Look for "Add to Home Screen" prompt
3. Follow the installation instructions

### Desktop
1. Visit the web app in Chrome/Edge
2. Click the install icon in the address bar
3. Confirm installation

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS + Radix UI
- **Database**: IndexedDB (via Dexie.js)
- **PWA**: Workbox service worker
- **Testing**: Vitest + Playwright
- **Deployment**: GitHub Pages / Vercel

## 🏗️ Development

### Prerequisites
- Node.js 18+ 
- pnpm 9+ (recommended) or npm/yarn

### Setup
```bash
# Clone the repository
git clone https://github.com/D35P4C1T0/shower-tracker.git
cd shower-tracker

# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

### Available Scripts
```bash
pnpm run dev          # Start development server
pnpm run build        # Build for production
pnpm run build:github # Build for GitHub Pages
pnpm run test         # Run unit tests
pnpm run test:e2e     # Run end-to-end tests
pnpm run lint         # Run ESLint
pnpm run preview      # Preview production build
```

### Testing
```bash
# Run all tests
pnpm run test

# Test deployment readiness
./test-deployment.sh

# Run E2E tests (requires browser setup)
pnpm run test:e2e
```

## 📊 Project Stats

- **185 unit tests** - Comprehensive test coverage
- **33 test files** - Testing all components and utilities
- **~600KB build size** - Optimized for fast loading
- **PWA compliant** - Meets all PWA requirements
- **Accessibility ready** - WCAG 2.1 compliant

## 🚀 Deployment

### GitHub Pages (Automatic)
1. Push to `main` branch
2. Enable GitHub Pages in repository settings
3. Set source to "GitHub Actions"
4. Automatic deployment on every push

### Vercel
1. Connect your GitHub repository to Vercel
2. Automatic deployment with zero configuration

### Manual Build
```bash
pnpm run build:github  # For GitHub Pages
pnpm run build         # For other platforms
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Write tests for new features
- Follow TypeScript best practices
- Ensure PWA compliance
- Test on multiple devices/browsers

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- [Radix UI](https://www.radix-ui.com/) for accessible components
- [Lucide](https://lucide.dev/) for beautiful icons
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- [Workbox](https://developers.google.com/web/tools/workbox) for PWA capabilities

---

**Made with ❤️ for better hygiene habits**
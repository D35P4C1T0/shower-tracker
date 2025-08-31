# Implementation Plan

- [x] 1. Set up project foundation and development environment
  - Initialize Vite + React + TypeScript project with PWA plugin
  - Configure Tailwind CSS and install shadcn/ui components
  - Set up project structure with folders for components, hooks, lib, stores, types, and pages
  - Create basic package.json with all required dependencies
  - _Requirements: 7.1, 7.2, 7.4_

- [x] 2. Implement core data models and storage layer
  - Define TypeScript interfaces for ShowerEntry, UserSettings, and AppState
  - Set up Dexie.js database configuration with showers, settings, and metadata tables
  - Create database service functions for CRUD operations on shower entries
  - Write unit tests for database operations and data models
  - _Requirements: 1.3, 7.6_

- [x] 3. Create app state management and context providers
  - Implement React Context for global app state management
  - Create useReducer-based state management for showers and settings
  - Build custom hooks for database operations (useShowers, useSettings)
  - Write tests for state management logic and context providers
  - _Requirements: 1.3, 5.5_

- [x] 4. Build core UI layout and theme system
  - Create Layout component with responsive design and navigation structure
  - Implement theme provider with dark, light, and system theme support
  - Build theme switcher component using shadcn/ui components
  - Create responsive bottom navigation for mobile-first design
  - _Requirements: 5.4, 7.2_

- [x] 5. Implement shower recording functionality
  - Create HomePage component with prominent "Record it" button
  - Implement shower recording logic that saves to IndexedDB with current timestamp
  - Add visual feedback and confirmation when shower is recorded
  - Write tests for shower recording functionality and edge cases
  - _Requirements: 1.1, 1.2, 1.4_

- [x] 6. Build time tracking and display system
  - Create utility functions to calculate elapsed time since last shower
  - Implement time display component with appropriate units (seconds, minutes, hours, days, weeks)
  - Add auto-refresh functionality to update elapsed time display
  - Handle edge case when no showers have been recorded
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 7. Create calendar view and shower history visualization
  - Build Calendar component with monthly grid layout using shadcn/ui
  - Implement month navigation (previous/next) functionality
  - Add visual indicators for days with recorded showers
  - Create click interaction to show shower details for specific days
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 8. Implement settings page and user preferences
  - Create Settings page component with all configuration options
  - Build first day of week selector component
  - Implement notification toggle and threshold day input
  - Add GitHub repository and author information display (configurable)
  - Ensure all settings persist to IndexedDB and update app state
  - _Requirements: 5.1, 5.2, 5.3, 5.5_

- [x] 9. Build notification system
  - Implement browser notification permission request functionality
  - Create notification scheduling logic based on user-configured threshold
  - Add notification trigger checking on app startup and periodically
  - Build notification content with friendly reminder messages
  - Handle notification permission denial and provide fallback messaging
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 10. Implement PWA installation prompts
  - Create platform detection utility to identify Android vs iOS devices
  - Build Android installation prompt using beforeinstallprompt event
  - Create iOS-specific installation instructions modal
  - Add logic to hide prompts when app is already installed
  - Style installation prompts to match app design
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 11. Configure PWA service worker and manifest
  - Set up Vite PWA plugin with appropriate caching strategies
  - Create web app manifest with proper icons, theme colors, and metadata
  - Implement cache-first strategy for static assets and network-first for data
  - Add offline functionality for core features (recording, viewing history)
  - Test PWA installation and offline functionality
  - _Requirements: 6.5, 7.5_

- [x] 12. Add comprehensive error handling and user feedback
  - Implement React error boundaries for component error handling
  - Add loading states with skeleton screens for data operations
  - Create user-friendly error messages for storage failures and permission denials
  - Add success confirmation messages for user actions
  - Implement fallback to localStorage if IndexedDB is unavailable
  - _Requirements: 1.4, 4.4_

- [x] 13. Write comprehensive tests for all components
  - Create unit tests for all utility functions and custom hooks
  - Write integration tests for main user workflows using React Testing Library
  - Add accessibility tests using jest-axe for all interactive components
  - Create end-to-end tests for critical paths using Playwright
  - Test PWA functionality including offline mode and installation
  - _Requirements: 7.4_

- [x] 14. Configure deployment for GitHub Pages and Vercel
  - Set up GitHub Actions workflow for automated deployment to GitHub Pages
  - Configure Vercel deployment with proper build settings
  - Add environment-specific configurations for base paths and asset handling
  - Optimize build output with code splitting and asset compression
  - Test deployment on both platforms and verify PWA functionality
  - _Requirements: 7.3_

- [x] 15. Perform final optimization and polish
  - Run Lighthouse audits and optimize Core Web Vitals scores
  - Implement code splitting for optimal bundle sizes
  - Add proper meta tags and SEO optimization
  - Ensure all accessibility requirements are met
  - Test cross-browser compatibility and mobile responsiveness
  - _Requirements: 7.4, 7.5_
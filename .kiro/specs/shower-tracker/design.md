# Design Document

## Overview

The Shower Tracker PWA will be built as a single-page application using React with TypeScript for type safety and maintainability. The app will leverage modern web APIs for notifications, local storage, and PWA functionality. The design emphasizes simplicity, performance, and offline-first capabilities.

## Architecture

### Technology Stack
- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: shadcn/ui with Tailwind CSS for modern, accessible components
- **State Management**: React Context API with useReducer for global state
- **Data Storage**: IndexedDB via Dexie.js for structured local data persistence
- **PWA**: Vite PWA plugin for service worker and manifest generation
- **Deployment**: Configured for both GitHub Pages and Vercel

### Application Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── Calendar/       # Calendar view components
│   ├── Settings/       # Settings page components
│   └── Layout/         # App layout components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and configurations
├── stores/             # Context providers and state management
├── types/              # TypeScript type definitions
└── pages/              # Main page components
```

## Components and Interfaces

### Core Components

#### 1. HomePage Component
- **Purpose**: Main interface with shower recording and time display
- **Key Features**:
  - Large "Record it" button for shower logging
  - Time since last shower display with auto-refresh
  - PWA installation prompt (platform-specific)
- **State**: Current time, last shower timestamp, installation prompt visibility

#### 2. Calendar Component
- **Purpose**: Visual representation of shower history
- **Key Features**:
  - Monthly calendar grid with navigation
  - Visual indicators for days with recorded showers
  - Click interaction to view shower details
  - Responsive design for mobile and desktop
- **State**: Current month/year, shower data for visible period

#### 3. Settings Component
- **Purpose**: User preferences and app configuration
- **Key Features**:
  - Theme switcher (dark/light/system)
  - First day of week selector
  - Notification toggle and threshold setting
  - GitHub repository and author display
- **State**: All user preferences, editable project metadata

#### 4. Layout Component
- **Purpose**: App shell with navigation and theme provider
- **Key Features**:
  - Bottom navigation for mobile-first design
  - Theme context provider
  - Responsive layout container

### Data Models

#### Shower Entry
```typescript
interface ShowerEntry {
  id: string;
  timestamp: Date;
  notes?: string; // Optional for future enhancement
}
```

#### User Settings
```typescript
interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  firstDayOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
  notificationsEnabled: boolean;
  notificationThresholdDays: number;
  projectInfo: {
    githubRepo: string;
    author: string;
  };
}
```

#### App State
```typescript
interface AppState {
  showers: ShowerEntry[];
  settings: UserSettings;
  lastNotificationCheck: Date | null;
}
```

## Data Storage Strategy

### IndexedDB with Dexie.js
- **Database Name**: `ShowerTrackerDB`
- **Tables**:
  - `showers`: Store all shower entries with timestamps
  - `settings`: Store user preferences and configuration
  - `metadata`: Store app metadata and last sync timestamps

### Storage Operations
- **Create**: Add new shower entries with auto-generated IDs
- **Read**: Query showers by date range for calendar display
- **Update**: Modify settings and preferences
- **Delete**: Remove individual shower entries (future enhancement)

## User Interface Design

### Design System
- **Color Palette**: Leveraging shadcn/ui default themes with custom shower-themed accents
- **Typography**: System font stack for optimal performance and readability
- **Spacing**: Consistent 8px grid system via Tailwind CSS
- **Components**: Accessible, keyboard-navigable components from shadcn/ui

### Responsive Design
- **Mobile-First**: Optimized for touch interactions and small screens
- **Breakpoints**: 
  - Mobile: < 768px (primary target)
  - Tablet: 768px - 1024px
  - Desktop: > 1024px

### Theme Implementation
- **CSS Variables**: Dynamic theme switching via CSS custom properties
- **System Theme**: Automatic detection and response to OS theme changes
- **Persistence**: Theme preference stored in local settings

## PWA Implementation

### Service Worker Strategy
- **Caching Strategy**: Cache-first for static assets, network-first for data
- **Offline Support**: Core functionality available without network
- **Update Handling**: Prompt user for app updates when new version available

### Web App Manifest
```json
{
  "name": "Shower Tracker",
  "short_name": "Showers",
  "description": "Track your shower habits with a simple PWA",
  "theme_color": "#3b82f6",
  "background_color": "#ffffff",
  "display": "standalone",
  "start_url": "/",
  "icons": [
    // Various sizes for different platforms
  ]
}
```

### Installation Prompts
- **Android**: Use `beforeinstallprompt` event for native install banner
- **iOS**: Custom modal with Safari-specific instructions
- **Detection**: Platform detection to show appropriate installation method

## Notification System

### Browser Notifications
- **Permission Handling**: Request notification permissions on settings enable
- **Scheduling**: Use `setTimeout` with persistence across sessions
- **Content**: Friendly reminder messages with app branding
- **Fallback**: Graceful degradation when notifications unavailable

### Notification Logic
- **Trigger**: Check elapsed time on app startup and periodically
- **Threshold**: User-configurable days since last shower
- **Frequency**: Maximum one notification per threshold period
- **Persistence**: Track last notification time to prevent spam

## Error Handling

### Data Layer Errors
- **Storage Failures**: Fallback to localStorage if IndexedDB unavailable
- **Corruption**: Data validation and recovery mechanisms
- **Migration**: Version handling for future schema changes

### UI Error Boundaries
- **Component Errors**: React error boundaries with user-friendly messages
- **Network Errors**: Offline indicators and retry mechanisms
- **Permission Errors**: Clear messaging for denied permissions

### User Feedback
- **Success States**: Confirmation messages for actions
- **Loading States**: Skeleton screens and progress indicators
- **Error States**: Actionable error messages with recovery options

## Testing Strategy

### Unit Testing
- **Framework**: Vitest for fast, modern testing
- **Coverage**: Core business logic, utility functions, and hooks
- **Mocking**: IndexedDB operations and browser APIs

### Integration Testing
- **Framework**: React Testing Library for component testing
- **Scenarios**: User workflows and component interactions
- **Accessibility**: Automated a11y testing with jest-axe

### End-to-End Testing
- **Framework**: Playwright for cross-browser testing
- **Critical Paths**: Shower recording, calendar navigation, settings
- **PWA Features**: Installation flow and offline functionality

### Performance Testing
- **Metrics**: Core Web Vitals monitoring
- **Bundle Analysis**: Size optimization and code splitting
- **Lighthouse**: PWA compliance and performance scoring

## Deployment Configuration

### GitHub Pages
- **Build Process**: GitHub Actions workflow for automated deployment
- **Base Path**: Configure for repository subdirectory if needed
- **Static Assets**: Optimized asset handling and caching headers

### Vercel
- **Framework Preset**: Automatic React/Vite detection
- **Environment**: Production optimizations and edge caching
- **Analytics**: Optional Vercel Analytics integration

### Build Optimization
- **Code Splitting**: Route-based and component-based splitting
- **Tree Shaking**: Eliminate unused code from final bundle
- **Asset Optimization**: Image compression and format optimization
- **PWA Assets**: Automatic icon generation and manifest optimization
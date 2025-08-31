// Database exports
export { db, ShowerTrackerDB } from './database';
export { 
  ShowerService, 
  SettingsService, 
  MetadataService, 
  DatabaseService 
} from './database-service';
export type { 
  DBShowerEntry, 
  DBUserSettings, 
  DBMetadata 
} from './database';

// Utility exports
export { cn } from './utils';
export * from './calendar-utils';
export * from './platform-utils';

// PWA exports
export { pwaService } from './pwa-service';
export type { 
  PWAUpdateInfo, 
  PWAInstallInfo, 
  NetworkStatus 
} from './pwa-service';

// Performance exports
export { observeWebVitals, logWebVitals } from './performance';
export type { WebVitalsMetric } from './performance';
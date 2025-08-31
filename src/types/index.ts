export interface ShowerEntry {
  id: string;
  timestamp: Date;
  notes?: string;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  firstDayOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
  notificationsEnabled: boolean;
  notificationThresholdDays: number;
  projectInfo: {
    githubRepo: string;
    author: string;
  };
}

export interface AppState {
  showers: ShowerEntry[];
  settings: UserSettings;
  lastNotificationCheck: Date | null;
}

export type Theme = 'light' | 'dark' | 'system';
import type { UserSettings } from '../../types';

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system',
  firstDayOfWeek: 0,
  notificationsEnabled: false,
  notificationThresholdDays: 3,
  projectInfo: {
    githubRepo: 'https://github.com/D35P4C1T0/shower-tracker',
    author: 'D35P4C1T0'
  }
};

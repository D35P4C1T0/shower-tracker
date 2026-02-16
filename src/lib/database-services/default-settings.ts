import type { UserSettings } from '../../types';

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system',
  firstDayOfWeek: 0,
  notificationsEnabled: false,
  notificationThresholdDays: 3,
  projectInfo: {
    githubRepo: 'https://github.com/user/shower-tracker',
    author: 'Shower Tracker App'
  }
};

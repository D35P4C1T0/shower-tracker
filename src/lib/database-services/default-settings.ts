import type { UserSettings } from '../../types';

const LEGACY_PROJECT_REPO = 'https://github.com/user/shower-tracker';
const LEGACY_PROJECT_AUTHOR = 'Shower Tracker App';
export const DEFAULT_WEEKLY_SHOWER_TARGET = 4;
export const DEFAULT_MONTHLY_SHOWER_TARGET = 16;

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system',
  firstDayOfWeek: 0,
  notificationsEnabled: false,
  notificationThresholdDays: 3,
  showerGoals: {
    weekly: DEFAULT_WEEKLY_SHOWER_TARGET,
    monthly: DEFAULT_MONTHLY_SHOWER_TARGET
  },
  projectInfo: {
    githubRepo: 'https://github.com/D35P4C1T0/shower-tracker',
    author: 'D35P4C1T0'
  }
};

export function normalizeProjectInfo(
  projectInfo?: Partial<UserSettings['projectInfo']> | null
): UserSettings['projectInfo'] {
  const githubRepo = projectInfo?.githubRepo?.trim();
  const author = projectInfo?.author?.trim();

  const normalizedRepo = !githubRepo || githubRepo === LEGACY_PROJECT_REPO
    ? DEFAULT_SETTINGS.projectInfo.githubRepo
    : githubRepo;

  const normalizedAuthor = !author || author === LEGACY_PROJECT_AUTHOR
    ? DEFAULT_SETTINGS.projectInfo.author
    : author;

  return {
    githubRepo: normalizedRepo,
    author: normalizedAuthor
  };
}

export function normalizeShowerGoals(
  showerGoals?: Partial<UserSettings['showerGoals']> | null
): UserSettings['showerGoals'] {
  const weekly = Number(showerGoals?.weekly);
  const monthly = Number(showerGoals?.monthly);

  return {
    weekly: Number.isFinite(weekly) && weekly > 0 ? weekly : DEFAULT_SETTINGS.showerGoals.weekly,
    monthly: Number.isFinite(monthly) && monthly > 0 ? monthly : DEFAULT_SETTINGS.showerGoals.monthly
  };
}

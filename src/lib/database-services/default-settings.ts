import type { UserSettings } from '../../types';

const LEGACY_PROJECT_REPO = 'https://github.com/user/shower-tracker';
const LEGACY_PROJECT_AUTHOR = 'Shower Tracker App';

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

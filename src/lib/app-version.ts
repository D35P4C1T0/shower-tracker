export const APP_VERSION = typeof __APP_VERSION__ === 'undefined' ? '0.0.0-test' : __APP_VERSION__;
export const APP_COMMIT = typeof __APP_COMMIT__ === 'undefined' ? 'test' : __APP_COMMIT__;
export const APP_BUILD_ID = typeof __APP_BUILD_ID__ === 'undefined' ? `${APP_VERSION}-${APP_COMMIT}` : __APP_BUILD_ID__;

export function formatAppVersion(): string {
  return `${APP_VERSION} (${APP_COMMIT.slice(0, 7)})`;
}

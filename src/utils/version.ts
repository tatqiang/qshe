// Define the app version - update this when releasing new versions
export const APP_VERSION = '1.1.1';

export const getAppVersion = (): string => {
  return APP_VERSION;
};

export const getFormattedVersion = (): string => {
  return `v${APP_VERSION}`;
};
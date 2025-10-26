// Import version from package.json
import packageJson from '../../package.json';

// Get version from package.json instead of hardcoding
export const APP_VERSION = packageJson.version;

export const getAppVersion = (): string => {
  return APP_VERSION;
};

export const getFormattedVersion = (): string => {
  return `v${APP_VERSION}`;
};
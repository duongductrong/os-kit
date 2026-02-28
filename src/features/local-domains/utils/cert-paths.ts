import { appDataDir } from "@tauri-apps/api/path";

/** Cached app data dir to avoid repeated async resolution */
let cachedAppDataDir: string | null = null;

/** Get the base cert storage directory for a domain */
export async function getCertDir(domain: string): Promise<string> {
  if (!cachedAppDataDir) {
    cachedAppDataDir = await appDataDir();
  }
  return `${cachedAppDataDir}certs/${domain}`;
}

/** Get the cert file path within a cert directory */
export function getCertPath(certDir: string): string {
  return `${certDir}/cert.pem`;
}

/** Get the key file path within a cert directory */
export function getKeyPath(certDir: string): string {
  return `${certDir}/key.pem`;
}

/** Check if a cert expiry date is within threshold days */
export function isExpiringSoon(
  expiry: string | null,
  daysThreshold = 30,
): boolean {
  if (!expiry) return false;
  const diff = new Date(expiry).getTime() - Date.now();
  return diff > 0 && diff < daysThreshold * 86400000;
}

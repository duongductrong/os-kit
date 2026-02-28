/** Domain validation regex: lowercase alphanumeric + hyphens + dots, at least two labels */
const DOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

/** Characters unsafe for shell interpolation */
const SHELL_UNSAFE = /[;&|`$(){}[\]!#~'"\\<>\s]/;

const RESERVED_HOSTNAMES = new Set([
  "localhost",
  "broadcasthost",
  "ip6-localhost",
  "ip6-loopback",
]);

const MAX_DOMAIN_LENGTH = 253;
const MAX_LABEL_LENGTH = 63;

/** Normalize domain: lowercase, trim whitespace */
export function sanitizeDomain(domain: string): string {
  return domain.toLowerCase().trim();
}

/** Validate a domain string for local use. Returns true if valid */
export function isValidDomain(domain: string): boolean {
  return getDomainError(domain) === null;
}

/** Returns an error message for invalid domains, or null if valid */
export function getDomainError(domain: string): string | null {
  const clean = sanitizeDomain(domain);

  if (!clean) return "Domain is required";
  if (clean.length > MAX_DOMAIN_LENGTH) return "Domain exceeds 253 characters";
  if (SHELL_UNSAFE.test(clean)) return "Domain contains unsafe characters";
  if (RESERVED_HOSTNAMES.has(clean)) return "Cannot use reserved hostname";
  if (!DOMAIN_REGEX.test(clean)) return "Invalid domain format (e.g. myapp.local)";

  const labels = clean.split(".");
  for (const label of labels) {
    if (label.length > MAX_LABEL_LENGTH) {
      return `Label "${label}" exceeds 63 characters`;
    }
  }

  return null;
}

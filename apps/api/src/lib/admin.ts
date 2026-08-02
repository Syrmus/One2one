// Owner allow-list for the analytics view, from the ADMIN_EMAILS env var
// (comma-separated). Empty/unset => nobody is admin (stats locked down).
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const allow = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(email.toLowerCase());
}

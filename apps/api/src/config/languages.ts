// Supported L2 languages. Adding a language is a config change here plus
// seed content under src/content/seed/<code>/ — no core code changes
// (SPEC §2, NFR-7).
export const SUPPORTED_LANGUAGES = [
  { code: "de", label: "German" },
  { code: "nl", label: "Dutch" },
  { code: "es", label: "Spanish" },
] as const;

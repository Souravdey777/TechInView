/** Site-level SEO constants. */

/** Canonical origin. Mirrors the fallback used across the app. */
export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "https://techinview.dev").replace(
    /\/$/,
    ""
  );
}

/** Default title, used on the home page and any route without its own title. */
export const SITE_DEFAULT_TITLE = "TechInView: AI Mock Interviews for Software Engineers";

/** Default meta description. Keep under ~160 characters. */
export const SITE_DEFAULT_DESCRIPTION =
  "Mock interviews with a voice AI interviewer. Talk through DSA problems in a live code editor, then get a scorecard and transcript of the round. Practice mode is free.";

/** Shorter variant for Open Graph and X cards. */
export const SITE_SOCIAL_DESCRIPTION =
  "Talk through DSA problems with a voice AI interviewer in a live code editor, then get a scorecard and transcript of the round.";

/** Matches `--brand-deep` (7 8 10) in globals.css. */
export const SITE_THEME_COLOR = "#07080a";


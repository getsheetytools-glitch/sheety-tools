// _data/site.js
// ─────────────────────────────────────────────────────────────
// Single source of truth for shared site values.
// Available in every template as {{ site.name }}, {{ site.year }}, etc.
// ─────────────────────────────────────────────────────────────
module.exports = {
  name:       "Sheety Tools",
  tagline:    "Productivity tools built without bloat. No accounts unless you need them. No subscriptions. Just useful.",
  url:        "https://sheety.tools",

  // Primary CTA
  ctaUrl:     "https://list.sheety.tools",
  ctaLabel:   "Try Sheety List →",

  // Support link
  kofi:       "https://ko-fi.com/sheetytools",

  // Waitlist (Sheety Onboarding)
  waitlistUrl: "https://forms.gle/8ptuwNmgn8xt34sW7",

  // Auto-updating year for footer copyright
  year: new Date().getFullYear(),
};

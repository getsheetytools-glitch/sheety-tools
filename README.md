# Sheety Tools

Free, open-source productivity tools — plus **Sheety Onboarding**, a paid employee onboarding platform currently in development.

Website: [sheety.tools](https://sheety.tools)
Support the project: [ko-fi.com/sheetytools](https://ko-fi.com/sheetytools)

---

## File structure

```
sheety.tools/
├── index.html              # Homepage (conversion-focused, waitlist CTA)
├── terms.html              # Terms & Conditions (linked from footer, noindex)
├── focus-budget.html       # Focus Budget app
├── styles.css              # Focus Budget styles
├── app.js                  # Focus Budget logic
├── utils.js                # Focus Budget utilities
├── storage.js              # Focus Budget storage
├── Sheety_Logo.png         # Brand logo
└── Sparkle_mug.gif         # Ko-fi floating button asset
```

Sheety List lives at a separate subdomain: [list.sheety.tools](https://list.sheety.tools)

---

## Products

### Sheety Onboarding *(in development — paid)*

A no-bloat employee onboarding platform built with Fillout forms. No per-seat pricing, no lengthy setup, no onboarding for your onboarding tool.

**Status:** In development. A waitlist form is linked throughout the homepage.
Waitlist: [forms.gle/8ptuwNmgn8xt34sW7](https://forms.gle/8ptuwNmgn8xt34sW7)

#### When Onboarding goes live

1. Replace all instances of the waitlist URL (`https://forms.gle/8ptuwNmgn8xt34sW7`) in `index.html` with `/onboarding`
2. Update the hero eyebrow pill text from `"coming soon"` to `"now live"` (or remove it)
3. Update the benefits section label from `"Sheety Onboarding — in development"` to `"Sheety Onboarding"`
4. Update the CTA band headline from `"Be first when it launches."` to something action-oriented (e.g. `"Ready to fix onboarding?"`)
5. Update the CTA band body copy from the waitlist framing to a direct product pitch
6. Paste your Fillout embed code into the comment block inside `<section class="form-section">` in `onboarding/index.html`

---

### Focus Budget *(free, open source)*

Visualize your priorities as a weighted pie chart where each item is worth twice the next. Runs entirely in the browser — no account, no tracking, no data leaves the device.

Data is stored in `localStorage` under the key `sheety:focusBudget:v1`.

---

### Sheety List *(free, open source)*

A clean, no-friction checklist tool hosted at [list.sheety.tools](https://list.sheety.tools). Build lists fast, check things off, move on.

---

## Account philosophy

Sheety Tools uses no accounts when it makes sense, and Google sign-in only when you're saving personal information. Tools like Focus Budget run entirely locally with no login. Tools that store user-specific data use Google authentication rather than a proprietary account system.

---

## Deployment

All files are static — no build step required.

### GitHub Pages

1. Push to a repository
2. Enable GitHub Pages (Settings → Pages → source: `main`, root `/`)
3. Point your custom domain if needed

### Netlify / Vercel

1. Connect the repository
2. Build command: *(none)*
3. Publish directory: `/`

### Testing before going live

Create a `dev` branch in GitHub (branch dropdown → type "dev" → Create branch). Netlify will automatically generate a preview URL (e.g. `dev--sheety-tools.netlify.app`) without touching the live site. Push changes to `dev`, test via the preview URL, then merge to `main` when ready.

### Custom domain

Update the `CNAME` file with your domain (`sheety.tools`), then configure DNS with your registrar.

---

## Adding a new tool

1. Create `your-tool.html` (and any JS/CSS files it needs)
2. Add a card to the `.tools-grid` in `index.html`:

```html
<a href="./your-tool.html" class="tool-card fade-up">
  <div class="tool-icon">🎯</div>
  <div class="tool-name">Your Tool Name</div>
  <p class="tool-desc">What it does, briefly.</p>
  <div class="tool-foot">
    <span class="badge badge-free">Free · Open source</span>
    <span class="tool-arrow">→</span>
  </div>
</a>
```

For tools hosted on subdomains (like Sheety List), set `target="_blank" rel="noopener"` on the anchor and use the full URL as the `href`.

---

## Customization

### Colors

Edit CSS variables at the top of `index.html`:

```css
--green:  #2ec97e;   /* Primary accent */
--orange: #e07a3a;   /* Secondary accent */
```

### Ko-fi link

Search for `ko-fi.com/sheetytools` and replace with your Ko-fi URL (appears in nav, footer, and floating button).

### Waitlist link

Search for `forms.gle/8ptuwNmgn8xt34sW7` to find all waitlist CTAs. Replace with `/onboarding` when the product launches.

---

## Focus Budget — configuration

Edit the `CONFIG` object in `utils.js`:

```js
const CONFIG = {
  PIE: {
    cx: 200, cy: 200,
    outerRadius: 180,
    innerRadius: 90,
    minSlicePercent: 0.5,
  },
  COLOR: {
    topHue: 180,
    bottomHue: 340,
    baseSaturation: 75,
    topLightness: 55,
    bottomLightness: 60,
  },
  DISTRIBUTION: {
    topRatio: 5,
    bottomRatio: 1,
  },
  DEBOUNCE_MS: 500,
};
```

### Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl/Cmd + ↑` | Move item up |
| `Ctrl/Cmd + ↓` | Move item down |
| `Ctrl/Cmd + Del` | Delete item |
| `Esc` | Deselect |

---

## A note on how this was built

This project was developed with AI coding assistance (Claude and ChatGPT). The product ideas, design decisions, and instructional structure are the work of the human creator. We think that's worth saying plainly.

---

## License

Free tools are open source under the **MIT License**.
The Sheety brand and Sheety Onboarding product are not covered by this license.

© 2026 Sheety Tools

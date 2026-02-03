# Sheety Tools Website

Free, open-source productivity tools. Simple, beautiful, and built for focus.

## File Structure

```
sheety.tools/
├── index.html              # Homepage (landing page)
├── homepage.css            # Homepage styles
├── focus-budget.html       # Focus Budget app
├── styles.css              # Focus Budget styles
├── app.js                  # Focus Budget logic
├── utils.js                # Focus Budget utilities
├── storage.js              # Focus Budget storage
├── Sheety_Logo.png         # Logo
└── Sparkle_mug.gif         # Ko-fi button
```

## Current Products

### Focus Budget
- **File**: `focus-budget.html`
- **Description**: Visualize priorities with a pie chart where each item is worth 2× the next
- **Status**: ✅ Live

## Adding New Products

To add a new product to the homepage:

1. **Create the product files**
   - Create `your-product.html` for the app
   - Create `your-product.css` for styles
   - Create any necessary JS files

2. **Add to homepage**
   Edit `index.html` and add a new product card in the `.product-grid`:

   ```html
   <article class="product-card">
     <div class="product-icon">🎯</div>
     <h3 class="product-name">Your Product Name</h3>
     <p class="product-description">
       Brief description of what your product does.
     </p>
     <div class="product-meta">
       <span class="badge">Free</span>
       <span class="badge">Open Source</span>
     </div>
     <div class="product-actions">
       <a href="./your-product.html" class="btn btn-primary">Launch App</a>
       <a href="https://github.com/yourusername/your-product" 
          class="btn btn-secondary" 
          target="_blank" 
          rel="noopener noreferrer">
         View Source
       </a>
     </div>
   </article>
   ```

3. **Update the "coming soon" card**
   - Remove it once you have 3+ products
   - Or keep it for community engagement

## Deployment

### GitHub Pages
1. Push to a GitHub repository
2. Enable GitHub Pages in repository settings
3. Set source to `main` branch, root folder

### Netlify
1. Connect your GitHub repository
2. Build command: (none)
3. Publish directory: `/`

### Custom Domain
Point your domain to your hosting provider's nameservers.

For `sheety.tools`:
- Set up DNS A records
- Enable HTTPS/SSL

## Customization

### Update Links
Search for these placeholders and replace:
- `https://github.com/yourusername` - Your GitHub profile
- `https://twitter.com/yourusername` - Your Twitter
- `https://ko-fi.com/sheetytools` - Your Ko-fi page

### Colors
Edit CSS variables in `homepage.css`:

```css
:root {
  --bg: #0b0d12;           /* Background */
  --accent: #6ae3b4;       /* Primary accent */
  --accent-hover: #7ff0c4; /* Accent hover */
  /* ... */
}
```

### Logo
Replace `Sheety_Logo.png` with your own logo (recommended: 512×512px PNG)

## License

All Sheety Tools are open source under the MIT License.

## Support

If you find these tools useful, consider supporting development:
- Ko-fi: https://ko-fi.com/sheetytools
- GitHub Sponsors: (coming soon)

## Contact

- Website: https://sheety.tools
- GitHub: https://github.com/yourusername
- Twitter: https://twitter.com/yourusername

---

Built with ❤️ by the Sheety Tools team

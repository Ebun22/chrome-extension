# BAXUS Price Checker Chrome Extension

## Overview

**BAXUS Price Checker** is a Chrome extension that helps users compare wine prices between external websites and the BAXUS marketplace. When browsing a wine listing online, the extension scrapes the current page for wine details (title, price, sold-out status) and compares them to BAXUS listings, highlighting potential savings and providing direct links to BAXUS.

---

## Features

- **Automatic Scraping:** Extracts wine titles, prices, and sold-out status from a wide variety of web page structures.
- **Smart Matching:** Uses a word-matching algorithm to find the best BAXUS listing for the scraped wine.
- **Currency Support:** Handles multiple currencies ($, £, €, ₦) and converts them to USD for accurate comparison.
- **Savings Calculation:** Shows how much you can save by buying on BAXUS, with clear percentage and dollar amount.
- **Sold Out Detection:** Recognizes and handles sold-out bottles on external sites.
- **Modern UI:** Clean, responsive popup interface built with React and Tailwind CSS.
- **Direct Links:** Quick access to the matching BAXUS listing.

---

## Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd <your-repo-directory>
   ```
2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```
3. **Build the extension:**
   ```bash
   npm run build
   # or
   yarn build
   ```
4. **Load into Chrome:**
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` or `build` directory

---

## Usage

1. **Navigate to a wine listing page** on any supported website.
2. **Click the BAXUS Price Checker extension icon** in your Chrome toolbar.
3. The popup will display:
   - The scraped wine title and price from the current page
   - The best matching BAXUS listing
   - Price comparison and savings
   - A direct link to view the item on BAXUS

---

## How It Works

- **Scraping:**
  - The extension injects a script into the current tab to extract wine titles (from headings and styled elements) and prices (from nearby tags, child divs, and currency patterns).
  - It detects sold-out status using keywords and class names.
- **Matching:**
  - The extension fetches BAXUS listings via an API.
  - It compares the scraped wine to BAXUS listings using a word-match algorithm:
    - If the wine name is 5 words or fewer, 3+ word matches are required.
    - If more than 5 words, 5+ matches are required.
  - Currency conversion is applied for accurate price comparison.
- **UI:**
  - Results are shown in a modern, responsive popup with clear savings and direct links.

---

## Code Structure

- `src/App.tsx` — Main React component, handles data fetching, scraping, and UI logic.
- `src/utils/scraper.ts` — Scraping logic for extracting wine data from arbitrary web pages.
- `src/components/PriceComparison.tsx` — UI component for displaying price comparisons and savings.
- `src/services/api.ts` — Handles API requests to fetch BAXUS listings.
- `src/content.ts` — DOM helper utilities for advanced scraping.
- `src/App.css` — Tailwind CSS and custom styles for the popup.

---

## Security & Permissions

This extension follows Chrome's best security practices:

- **Permissions:**
  - Requests only the permissions required for operation:
    - `"activeTab"` and `"scripting"` to inject scripts into the current tab when the user interacts with the extension.
    - `"host_permissions"` (e.g., `"https://*/*"`, `"http://*/*"`) to specify which sites the extension can access. Restrict these to only the domains you need.
- **Content Security Policy:**
  - Restricts scripts to those bundled with the extension. Set in `manifest.json` under `"content_security_policy"`.
- **No Sensitive Data:**
  - The extension does not collect or store any sensitive user data.
- **No Remote Code Execution:**
  - All code is bundled and reviewed; no use of `eval` or similar unsafe functions.
- **Where to configure:**
  - All permissions and security settings are configured in your `manifest.json` file.

**Sample `manifest.json` permissions section:**
```json
{
  "permissions": [
    "activeTab",
    "scripting"
  ],
  "host_permissions": [
    "https://*/*",
    "http://*/*"
  ],
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

**If you fork or extend this project, only request the permissions you need and review Chrome's [extension security guidelines](https://developer.chrome.com/docs/extensions/mv3/tut_security/).**

---

## Customization

- **Add new scraping rules:**
  - Edit `src/utils/scraper.ts` to support new website structures or price formats.
- **Change currency conversion rates:**
  - Update the conversion logic in `App.tsx`.
- **UI tweaks:**
  - Modify `src/App.css` or component files for custom branding or layout.

---

## Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Commit and push (`git commit -am 'Add new feature' && git push`)
5. Open a Pull Request

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

## Contact

For questions, suggestions, or support, please open an issue or contact the maintainer.

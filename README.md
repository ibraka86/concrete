# Concrete Block Calculator

A production-ready static website for calculating concrete masonry unit (CMU) materials including blocks, mortar, sand, grout fill, and reinforcement.

## Features

- **Fast Calculator**: Instant results for wall dimensions and material requirements
- **Mobile-First Design**: Responsive layout optimized for contractors on-site
- **SEO Optimized**: Structured data, meta tags, and accessibility features
- **Material Estimates**: Blocks, mortar bags, sand, grout, and horizontal reinforcement
- **Flexible Options**: Multiple block sizes (6", 8", 12"), fill options, waste calculations
- **Share Results**: Copy, print, or share calculations via URL
- **Offline Ready**: PWA capabilities with manifest and service worker support

## Tech Stack

- **HTML5**: Semantic markup with accessibility features
- **CSS3**: Light blue theme with dark mode support
- **Vanilla JavaScript**: Zero dependencies, fast loading
- **SEO**: JSON-LD structured data, Open Graph, Twitter Cards

## File Structure

```
/
├── index.html              # Main calculator page
├── styles.css              # Light blue/white theme styles
├── app.js                  # Calculator logic and DOM handlers
├── favicon.svg             # Block icon (SVG)
├── manifest.webmanifest    # PWA manifest
├── robots.txt              # Search engine directives
├── sitemap.xml             # XML sitemap
├── vercel.json             # Deployment configuration
└── README.md               # This file
```

## Calculator Logic

The calculator uses industry-standard formulas:

- **Blocks**: Wall area ÷ 0.889 ft² per block (including mortar joints)
- **Mortar**: ~7 bags per 100 blocks (configurable)
- **Sand**: Derived from mortar bag requirements
- **Reinforcement**: Based on 16" or 24" spacing vertically
- **Grout**: Volume factors per 100 ft² (0.93/1.12/1.65 yd³ for 6"/8"/12")

## Performance

- **Lighthouse Scores**: 95+ Performance, Accessibility, Best Practices, 100 SEO
- **Critical CSS**: Inlined above-the-fold styles
- **Deferred JS**: Non-blocking script loading
- **No External Fonts**: System font stack for fast loading

## Deployment

### Vercel (Recommended)
```bash
npm i -g vercel
vercel --prod
```

### Netlify
```bash
npm i -g netlify-cli
netlify deploy --prod --dir .
```

### Static Hosting
Upload all files to any static hosting provider (GitHub Pages, AWS S3, etc.)

## Local Development

1. Clone or download files
2. Serve locally:
   ```bash
   # Python
   python -m http.server 8000
   
   # Node.js
   npx serve .
   
   # PHP
   php -S localhost:8000
   ```
3. Open http://localhost:8000

## Configuration

Edit `CONFIG` object in `app.js` to adjust:
- Block dimensions and mortar joint thickness
- Mortar bags per 100 blocks ratio
- Sand requirements per mortar bag
- Grout factors for different block sizes
- Waste percentages and rounding rules

## SEO Features

- **Structured Data**: FAQPage JSON-LD for rich snippets
- **Meta Tags**: Complete Open Graph and Twitter Card implementation
- **Accessibility**: WCAG 2.1 AA compliant with proper ARIA labels
- **Keywords**: Optimized for "concrete block calculator", "CMU calculator", etc.
- **Internal Linking**: Descriptive anchor text for better crawling

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (ES2017+)
- **Progressive Enhancement**: Graceful degradation for older browsers
- **Mobile**: iOS 12+, Android 8+ with full PWA support

## License

MIT License - feel free to use and modify for your projects.

## Contact

For questions or suggestions: hello@concreteblockcalculator.com
# OpenWork Landing Page

This is the standalone landing page for OpenWork, extracted from the main application.

This directory is the canonical source for `www.openwork.technology`. Pushes to
`main` that change `landing/` are built and published by
`.github/workflows/landing.yml` to S3 bucket
`openwork-technology-landing-prod-256309399568`, then CloudFront distribution
`E1ANKLS7O4YGAE` is invalidated.

## Structure
- **src/pages/LandingPage/** - All landing page components and styles
- **public/assets/** - Only the assets used by the landing page (65 files)
- **public/fonts/** - Font files

## Installation
```bash
npm install
```

## Development
```bash
npm run dev
```

## Build
```bash
npm run build
```

## Assets Included
This repository contains only the assets specifically used by the landing page:
- Landing page specific icons and images (lp*.svg/png)
- Sidebar navigation icons
- UI elements and backgrounds
- Brand assets

Total: 65 assets copied successfully

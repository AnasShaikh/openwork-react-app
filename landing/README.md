# OpenWork Landing Page

This is the standalone landing page for OpenWork, extracted from the main application.

> ## Read before editing
>
> **Changes made here do not reach production yet.**
>
> This directory was merged into the monorepo on 3 August 2026 from
> `krishnaprasath-k/openwork-landing`, at commit `5d68562` — verified by rebuilding it
> here and byte-matching the production bundle `index-D93FVCTK.js`.
>
> The deploy pipeline was **not** moved with it. `www.openwork.technology` still builds
> from that original repository and publishes to S3
> `openwork-technology-landing-prod-256309399568` behind CloudFront `E1ANKLS7O4YGAE`.
>
> So until the pipeline is repointed at this directory:
>
> - Editing files here changes nothing on the live site.
> - The original repository is still canonical for the landing site.
> - Editing both creates two diverging copies.
>
> Tracked as item 1 in [PROJECT_STATUS.md](../PROJECT_STATUS.md#open-items-carried-over-from-the-3-august-2026-consolidation).
> Delete this notice once the pipeline points here.

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

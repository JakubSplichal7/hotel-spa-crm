# Resort background photos

Active files (rotated behind the main content):

- `resort-N-desktop.webp` — landscape, ~2400×1600 (tablets/desktop, `md+`)
- `resort-N-mobile.webp` — portrait, ~1080×1920 (phones)

Regenerate from `resort-N.jpg` sources:

```bash
node scripts/generate-resort-webps.mjs
```

Requires `sharp` (`npm install`).

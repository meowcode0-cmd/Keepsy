# Keepsy — your life, kept

A local-first, installable **PWA** that quietly remembers what you own, buy, use, plan and need to revisit.
Built with **Vite + vanilla ES modules** (no UI framework, no runtime dependencies). All data lives in your
browser on your device — no accounts, no servers, nothing syncs anywhere.

> **Don't make the user maintain Keepsy. Make Keepsy maintain itself.**

---

## 📲 Install it on your phone (after it's published)

### Android (Chrome)
1. Open the published Keepsy URL in **Chrome**.
2. Tap the **⋮ menu → "Add to Home screen" → Install**.
3. Keepsy appears in your app drawer with its own icon and opens full-screen, offline-capable.

### iPhone / iPad (Safari)
1. Open the published Keepsy URL in **Safari**.
2. Tap the **Share button → "Add to Home Screen" → Add**.
3. Keepsy opens full-screen like an app. Reminders appear inside Keepsy while it's open.

**Reminders:** on iPhone they show inside the app when it's open. On Android, the packaged Keepsy app
(Capacitor build) can show on-device notifications even when closed — no push service, no monthly plan,
reminder details never leave the device.

---

## Run it (for developers)

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production build → dist/   (serve dist/ over http for the service worker)
npm run build:single # one self-contained index.html → dist-single/ (works from a file, no server)
npm run preview      # serve the production build
```

Deploying: upload the contents of `dist/` to any static host (GitHub Pages, Netlify, Vercel, S3).
`base: './'` is set in `vite.config.js`, so it also works from a sub-directory. The hash router means
every deep link (`#/a/vehicles`, `#/r/<id>`, `#/month?m=2026-10`) resolves without server rewrites.

## Publish with GitHub Pages (the share-with-everyone way)

This project includes `.github/workflows/deploy-pages.yml`. Once it is in a GitHub repository, GitHub
Actions builds Keepsy and publishes the `dist/` website automatically on every update to `main`.

1. Create a **public** repository on GitHub (e.g. `keepsy`).
2. Upload all files from this package to the repository (web upload or `git push`).
3. In the repository, open **Settings → Pages**. Under **Build and deployment**, choose **GitHub Actions**.
4. Open the **Actions** tab and wait for **Deploy Keepsy to GitHub Pages** to finish (2–3 minutes).
5. Your public link appears under **Settings → Pages** and looks like:

   **`https://YOUR-USERNAME.github.io/keepsy/`**

Share that link with anyone — they open it in Chrome (Android) or Safari (iPhone) and install it with
the steps above. Their data stays private on their own device.

The URL stays under your GitHub account while the repository and Pages site remain available.

---

## What's inside

```
├── .github/workflows/deploy-pages.yml   auto-builds & publishes to GitHub Pages on every push
├── index.html                           app entry
├── public/
│   ├── manifest.webmanifest             installable PWA manifest + shortcuts
│   ├── sw.js                            offline shell cache (network-first, self-updating)
│   ├── .nojekyll                        lets GitHub Pages serve dotfile-free assets untouched
│   ├── fonts/                           Fraunces + DM Sans (bundled, offline)
│   └── icons/                           app icons incl. maskable icon for Android
├── src/
│   ├── app.js                           bootstrapping, routing, swipe navigation
│   ├── quickadd.js                      "What happened?" natural-language quick add
│   ├── sheets.js                        bottom sheets & flows
│   ├── core/                            store (local data), router, areas, parse, format, ui, viewkit
│   └── screens/                         home, timeline, calendar, reminders, search, insights,
│                                        month, record, private, settings, area views
├── styles/                              base.css + screens.css (the Keepsy look)
├── dist/                                the built website (ready to host as-is)
└── dist-single/index.html               the whole app in one file — open it directly, no server
```

## Privacy

Keepsy is local-first. Records are stored unencrypted in each user's browser storage and never leave
their device. Export/import is manual JSON, so users can back up or move a profile between devices
themselves.

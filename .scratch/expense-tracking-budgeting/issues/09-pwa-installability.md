# 09 — PWA installability

**What to build:** Make the app installable to a phone's home screen (manifest, icons, service worker), so it launches as a standalone app. Offline data access is explicitly not required.

**Blocked by:** 01 only — can run in parallel with 02–08.

**Status:** done

- [x] Web app manifest with app name (pt-BR), icons, and theme colors configured
- [x] Service worker registered sufficient for install-to-home-screen eligibility (no offline data caching required)
- [x] App is installable from Chrome on Android and shows as installable/addable from Safari on iOS
- [x] Launching the installed app opens it standalone (no browser chrome), landing on the login or dashboard as appropriate

## Comments

Commit: `85f8124` (single commit on branch `worktree-agent-a425d6bdd5d264e5a`) — "Implement ticket 09: PWA installability"

**What was built:**
- `src/app/manifest.ts` — Next.js App Router native manifest convention, auto-served at `/manifest.webmanifest`. Name "Finanças do Casal" / short name "Finanças" (pt-BR), `display: "standalone"`, `start_url: "/"`, theme color `#059669`, three icon entries (192x192, 512x512, and a 512x512 maskable variant).
- `src/app/app-info.ts` — small shared constants module (name/short name/description/theme color) so `layout.tsx` metadata and `manifest.ts` can't drift out of sync.
- `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png` — hand-generated placeholder PNGs (solid emerald background, white "F" mark), built with a one-off Node script (zlib + hand-rolled PNG/CRC32 encoding, no image-processing dependency added). Maskable variant uses a larger safe-zone margin so the mark isn't clipped when the OS applies its own mask shape.
- `public/sw.js` — minimal service worker: `install` (skipWaiting), `activate` (clients.claim), and a `fetch` handler that does a plain `event.respondWith(fetch(event.request))` passthrough. No cache storage, no offline strategy — intentionally out of scope per the spec.
- `src/components/pwa/service-worker-registration.tsx` — client component, registers `/sw.js` in a `useEffect` guarded by a `"serviceWorker" in navigator` feature check; rendered from the root layout body.
- `src/app/layout.tsx` — added `manifest`, `appleWebApp` (capable/statusBarStyle/title), and `icons` (icon + apple) to the `metadata` export; added a `viewport` export with `themeColor`; mounted `<ServiceWorkerRegistration />`.
- `vitest.config.ts` — broadened `include` to also pick up `src/app/**/*.test.ts` (was domain-only), so the new manifest test actually runs under `npm test`.
- `src/app/manifest.test.ts` — new unit test asserting manifest shape: pt-BR name/short_name/lang, `display: "standalone"`, theme color, and that both 192/512 icons plus a maskable 512 entry are present.

**How install-eligibility was verified** (no physical Android/iOS device available in this environment):
- `npm run build` confirms Next generates a static `/manifest.webmanifest` route from `manifest.ts` (visible in the build's route table).
- Manually inspected each generated PNG's IHDR header via a Node script to confirm actual pixel dimensions (192x192, 512x512, 512x512, 180x180) match what's declared in the manifest/metadata — a mismatch here is a common silent installability failure.
- Read `public/sw.js` against Chrome's documented installability heuristics: a service worker must be registered in scope and must have a `fetch` event listener — confirmed present (passthrough, no caching required).
- Verified `display: "standalone"` and `start_url: "/"` are set (root `/` redirects to `/dashboard`, which itself redirects unauthenticated users to `/login` — so a standalone launch lands on login or dashboard as appropriate, matching the ticket's last checkbox).
- Verified Safari/iOS's non-manifest install path is covered separately: `apple-touch-icon` link (180x180) plus `apple-mobile-web-app-capable` / `apple-mobile-web-app-title` meta tags via Next's `appleWebApp` metadata field (iOS ignores the web manifest for home-screen icons/standalone mode, relying on these tags instead).
- Did not run Lighthouse or an actual Chrome/Safari "Add to Home Screen" flow against a live deployed URL — this worktree has no public URL to test against. Recommend a manual Chrome DevTools Application-panel + Lighthouse PWA-installability check (and a real-device add-to-home-screen check on both platforms) once this is deployed/merged.

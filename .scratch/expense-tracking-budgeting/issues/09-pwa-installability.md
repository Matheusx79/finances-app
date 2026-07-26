# 09 — PWA installability

**What to build:** Make the app installable to a phone's home screen (manifest, icons, service worker), so it launches as a standalone app. Offline data access is explicitly not required.

**Blocked by:** 01 only — can run in parallel with 02–08.

**Status:** ready-for-agent

- [ ] Web app manifest with app name (pt-BR), icons, and theme colors configured
- [ ] Service worker registered sufficient for install-to-home-screen eligibility (no offline data caching required)
- [ ] App is installable from Chrome on Android and shows as installable/addable from Safari on iOS
- [ ] Launching the installed app opens it standalone (no browser chrome), landing on the login or dashboard as appropriate

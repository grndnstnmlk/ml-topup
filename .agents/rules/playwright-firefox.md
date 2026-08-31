# Konvensi Browser Playwright (Firefox Default)

1. **Default Browser Engine:**
   - Semua skrip otomatisasi, pengujian E2E, audit UI, dan pengambilan tangkapan layar Playwright **WAJIB** menggunakan engine Firefox (`const { firefox } = require('playwright')`).
   - Jangan gunakan `chromium` karena isu stabilitas/error di lingkungan sistem lokal.

2. **Eksekusi:**
   - Gunakan `firefox.launch({ headless: true })` atau `firefox.launch({ headless: false })`.

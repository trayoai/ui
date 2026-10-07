import { defineConfig, devices } from '@playwright/test'

// The layout checks run against the site's own dev server: /layout-check
// renders the kit's slot components with hostile children at fixed widths.
const PORT = 4391

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: 'list',
  use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${PORT}` },
  webServer: {
    command: `pnpm --filter trayo-ui-site exec astro dev --port ${PORT}`,
    url: `http://localhost:${PORT}/layout-check`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})

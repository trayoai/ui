// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'

// ui.trayo.ai — the component library's own site. Two pages:
//   /      the 1-pager (marketing tokens, matches www.trayo.ai)
//   /demo  the live component showcase (the LIBRARY's tokens)
// They deliberately load different stylesheets. Astro scopes an imported
// stylesheet to the page that imports it, which keeps the two token sets from
// colliding — the demo is then embedded on / in an iframe.
export default defineConfig({
  site: 'https://ui.trayo.ai',
  compressHTML: true,
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    server: {
      // The library lives one level up, outside the Astro root.
      fs: { allow: ['..'] },
    },
  },
})

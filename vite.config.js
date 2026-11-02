import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'
import { renderProjects, signatureDefs, signatureIntro, signatureLogo } from './src/render.js'

// Puts the project cards and the signature svg into the html at build time, so the page is
// plain html for search engines and the data stays in one json file.
function projectsPlugin() {
  return {
    name: 'render-projects',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const sig = JSON.parse(readFileSync(new URL('./src/data/signature.json', import.meta.url), 'utf8'))
        html = html
          .replace('<!-- @sig-defs -->', signatureDefs(sig))
          .replace('<!-- @sig-logo -->', signatureLogo(sig))
        if (!ctx.filename.endsWith('index.html')) return html
        html = html.replace('<!-- @sig-intro -->', signatureIntro(sig))
        const data = JSON.parse(readFileSync(new URL('./src/data/projects.json', import.meta.url), 'utf8'))
        const { featured, others } = renderProjects(data)
        return html.replace('<!-- @featured -->', featured).replace('<!-- @others -->', others)
      },
    },
    handleHotUpdate({ file, server }) {
      if (file.endsWith('.json') || file.endsWith('render.js')) server.ws.send({ type: 'full-reload' })
    },
  }
}

export default defineConfig({
  plugins: [projectsPlugin()],
  build: {
    rollupOptions: {
      input: { main: 'index.html', notfound: '404.html' },
    },
    chunkSizeWarningLimit: 700,
  },
})

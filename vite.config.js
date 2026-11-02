import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'
import { renderProjects } from './src/render.js'

// Puts the project cards into index.html at build time, so the page is
// plain html for search engines and the data stays in one json file.
function projectsPlugin() {
  return {
    name: 'render-projects',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        if (!ctx.filename.endsWith('index.html')) return html
        const data = JSON.parse(readFileSync(new URL('./src/data/projects.json', import.meta.url), 'utf8'))
        const { featured, others } = renderProjects(data)
        return html.replace('<!-- @featured -->', featured).replace('<!-- @others -->', others)
      },
    },
    handleHotUpdate({ file, server }) {
      if (file.endsWith('projects.json') || file.endsWith('render.js')) server.ws.send({ type: 'full-reload' })
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

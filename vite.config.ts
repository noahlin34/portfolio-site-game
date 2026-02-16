import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'
import { isLevelData } from './src/game/level/schema'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const levelFilePath = path.join(rootDir, 'src/game/level/level.json')

function levelEditorApiPlugin(): Plugin {
  return {
    name: 'level-editor-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/__editor/level')) {
          return next()
        }

        if (req.method === 'GET') {
          try {
            const content = await fs.readFile(levelFilePath, 'utf-8')
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(content)
          } catch {
            res.statusCode = 500
            res.end('Failed to read level file')
          }
          return
        }

        if (req.method === 'POST') {
          try {
            const chunks: Uint8Array[] = []
            for await (const chunk of req) {
              chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
            }
            const body = Buffer.concat(chunks).toString('utf-8')
            const payload = JSON.parse(body) as unknown

            if (!isLevelData(payload)) {
              res.statusCode = 400
              res.end('Invalid level payload')
              return
            }

            const withTimestamp = {
              ...payload,
              meta: {
                ...payload.meta,
                updatedAt: new Date().toISOString(),
              },
            }

            await fs.writeFile(levelFilePath, `${JSON.stringify(withTimestamp, null, 2)}\n`, 'utf-8')

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true, updatedAt: withTimestamp.meta.updatedAt }))
          } catch {
            res.statusCode = 500
            res.end('Failed to save level file')
          }
          return
        }

        res.statusCode = 405
        res.end('Method not allowed')
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), levelEditorApiPlugin()],
})

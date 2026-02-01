#!/usr/bin/env node
/**
 * OpenClaw Kanban CLI
 * 
 * Usage:
 *   npx openclaw-kanban [--file ./KANBAN.md] [--port 5173]
 */

import { createServer } from 'http'
import { readFile, writeFile, mkdir, access } from 'fs/promises'
import { dirname, resolve, isAbsolute, join } from 'path'
import { fileURLToPath } from 'url'
import { spawn } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Parse CLI args
const args = process.argv.slice(2)
let filePath = './KANBAN.md'
let port = 5173
let fileServerPort = 18790
let help = false

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--file' && args[i + 1]) {
    filePath = args[i + 1]
    i++
  } else if (args[i] === '--port' && args[i + 1]) {
    port = parseInt(args[i + 1], 10)
    i++
  } else if (args[i] === '--help' || args[i] === '-h') {
    help = true
  }
}

if (help) {
  console.log(`
📋 OpenClaw Kanban

Usage: npx openclaw-kanban [options]

Options:
  --file <path>   Path to KANBAN.md (default: ./KANBAN.md)
  --port <number> Dev server port (default: 5173)
  -h, --help      Show this help

Examples:
  npx openclaw-kanban
  npx openclaw-kanban --file ~/projects/myproject/KANBAN.md
  npx openclaw-kanban --port 3000
`)
  process.exit(0)
}

// Resolve file path
const absolutePath = isAbsolute(filePath) ? filePath : resolve(process.cwd(), filePath)

console.log(`
📋 OpenClaw Kanban
`)

// Check if KANBAN.md exists, create default if not
try {
  await access(absolutePath)
  console.log(`📄 Using: ${absolutePath}`)
} catch {
  console.log(`📄 Creating: ${absolutePath}`)
  const defaultContent = `# Inbox

- [ ] First task #example

# Today

<!-- No tasks -->

# In Progress

<!-- No tasks -->

# Done

<!-- No tasks -->
`
  await mkdir(dirname(absolutePath), { recursive: true })
  await writeFile(absolutePath, defaultContent, 'utf-8')
}

// Start file server
const fileServer = createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }
  
  const url = new URL(req.url, `http://localhost:${fileServerPort}`)
  
  try {
    if (url.pathname === '/read' && req.method === 'GET') {
      try {
        const content = await readFile(absolutePath, 'utf-8')
        res.writeHead(200, { 'Content-Type': 'text/plain' })
        res.end(content)
      } catch (err) {
        if (err.code === 'ENOENT') {
          res.writeHead(404)
          res.end('File not found')
        } else {
          throw err
        }
      }
    } else if (url.pathname === '/write' && req.method === 'POST') {
      const chunks = []
      for await (const chunk of req) {
        chunks.push(chunk)
      }
      const content = Buffer.concat(chunks).toString('utf-8')
      await writeFile(absolutePath, content, 'utf-8')
      res.writeHead(200)
      res.end('OK')
    } else {
      res.writeHead(404)
      res.end('Not found')
    }
  } catch (err) {
    console.error('Error:', err)
    res.writeHead(500)
    res.end('Internal error')
  }
})

fileServer.listen(fileServerPort, () => {
  console.log(`🔄 File sync server: http://localhost:${fileServerPort}`)
})

// Start vite dev server (from the package's dist)
const distPath = join(__dirname, '..', 'dist')

// For development, use vite preview; for production, serve static files
try {
  await access(distPath)
  
  // Serve static files
  const { createServer: createStaticServer } = await import('http')
  const { readFile: readStaticFile, stat } = await import('fs/promises')
  
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
  }
  
  const staticServer = createStaticServer(async (req, res) => {
    let filePath = req.url === '/' ? '/index.html' : req.url
    const fullPath = join(distPath, filePath)
    
    try {
      const stats = await stat(fullPath)
      if (stats.isDirectory()) {
        filePath = join(filePath, 'index.html')
      }
      
      const content = await readStaticFile(join(distPath, filePath))
      const ext = filePath.substring(filePath.lastIndexOf('.'))
      const contentType = mimeTypes[ext] || 'application/octet-stream'
      
      res.writeHead(200, { 'Content-Type': contentType })
      res.end(content)
    } catch {
      // SPA fallback: serve index.html for all routes
      try {
        const content = await readStaticFile(join(distPath, 'index.html'))
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(content)
      } catch {
        res.writeHead(404)
        res.end('Not found')
      }
    }
  })
  
  staticServer.listen(port, () => {
    console.log(`🚀 Board: http://localhost:${port}`)
    console.log('')
    console.log('Press Ctrl+C to stop')
  })
} catch {
  console.error('❌ dist folder not found. Run `npm run build` first.')
  process.exit(1)
}

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...')
  process.exit(0)
})

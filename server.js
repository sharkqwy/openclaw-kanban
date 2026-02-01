#!/usr/bin/env node
/**
 * Simple file server for KANBAN.md sync during development
 * 
 * Usage: node server.js [--port 18790] [--file ./KANBAN.md]
 */

import { createServer } from 'http'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { dirname, resolve, isAbsolute } from 'path'

const DEFAULT_PORT = 18790
const DEFAULT_FILE = './KANBAN.md'

// Parse CLI args
const args = process.argv.slice(2)
let port = DEFAULT_PORT
let filePath = DEFAULT_FILE

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' && args[i + 1]) {
    port = parseInt(args[i + 1], 10)
    i++
  } else if (args[i] === '--file' && args[i + 1]) {
    filePath = args[i + 1]
    i++
  }
}

// Resolve file path
const absolutePath = isAbsolute(filePath) ? filePath : resolve(process.cwd(), filePath)

const server = createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }
  
  const url = new URL(req.url, `http://localhost:${port}`)
  
  try {
    if (url.pathname === '/read' && req.method === 'GET') {
      // Read file
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
      // Write file
      const chunks = []
      for await (const chunk of req) {
        chunks.push(chunk)
      }
      const content = Buffer.concat(chunks).toString('utf-8')
      
      // Ensure directory exists
      await mkdir(dirname(absolutePath), { recursive: true })
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

server.listen(port, () => {
  console.log(`📋 Kanban file server running at http://localhost:${port}`)
  console.log(`   File: ${absolutePath}`)
  console.log('')
  console.log('   GET  /read  - Read KANBAN.md')
  console.log('   POST /write - Write KANBAN.md')
})

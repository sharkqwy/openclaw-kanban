#!/usr/bin/env node
/**
 * OpenClaw Kanban CLI
 * 
 * Usage:
 *   npx openclaw-kanban                    # Start web UI
 *   npx openclaw-kanban add "task"         # Add task to Inbox
 *   npx openclaw-kanban list               # List all tasks
 *   npx openclaw-kanban move <id> <column> # Move task
 *   npx openclaw-kanban done <id>          # Mark task done
 */

import { createServer } from 'http'
import { readFile, writeFile, mkdir, access } from 'fs/promises'
import { dirname, resolve, isAbsolute, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Parse CLI args
const args = process.argv.slice(2)
let filePath = './KANBAN.md'
let port = 5173
let fileServerPort = 18790
let command = 'serve' // default command

// Column mappings
const COLUMNS = {
  'inbox': 'Inbox',
  'today': 'Today', 
  'progress': 'In Progress',
  'inprogress': 'In Progress',
  'in-progress': 'In Progress',
  'done': 'Done'
}

// Parse arguments
let i = 0
while (i < args.length) {
  const arg = args[i]
  
  if (arg === '--file' && args[i + 1]) {
    filePath = args[i + 1]
    i += 2
  } else if (arg === '--port' && args[i + 1]) {
    port = parseInt(args[i + 1], 10)
    i += 2
  } else if (arg === '--help' || arg === '-h') {
    command = 'help'
    i++
  } else if (arg === 'add' || arg === 'list' || arg === 'move' || arg === 'done' || arg === 'start' || arg === 'serve') {
    command = arg
    i++
  } else {
    i++
  }
}

// Resolve file path
const absolutePath = isAbsolute(filePath) ? filePath : resolve(process.cwd(), filePath)

// Parse KANBAN.md into structured data
function parseKanban(content) {
  const lines = content.split('\n')
  const columns = { 'Inbox': [], 'Today': [], 'In Progress': [], 'Done': [] }
  let currentColumn = null
  let taskId = 0
  
  for (const line of lines) {
    // Check for column headers
    if (line.startsWith('# ')) {
      const header = line.slice(2).trim()
      if (columns[header] !== undefined) {
        currentColumn = header
      }
    }
    // Check for tasks
    else if (currentColumn && /^- \[[ x~]\]/.test(line)) {
      const match = line.match(/^- \[([ x~])\] (.+)$/)
      if (match) {
        taskId++
        const status = match[1]
        const text = match[2]
        columns[currentColumn].push({
          id: taskId,
          status,
          text,
          raw: line
        })
      }
    }
  }
  
  return columns
}

// Serialize columns back to KANBAN.md format
function serializeKanban(columns) {
  let content = ''
  
  for (const [name, tasks] of Object.entries(columns)) {
    content += `# ${name}\n\n`
    if (tasks.length === 0) {
      content += '<!-- No tasks -->\n'
    } else {
      for (const task of tasks) {
        content += `- [${task.status}] ${task.text}\n`
      }
    }
    content += '\n'
  }
  
  return content.trim() + '\n'
}

// Ensure KANBAN.md exists
async function ensureFile() {
  try {
    await access(absolutePath)
  } catch {
    const defaultContent = `# Inbox

<!-- No tasks -->

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
}

// Commands
async function cmdHelp() {
  console.log(`
📋 OpenClaw Kanban

Usage: openclaw-kanban [command] [options]

Commands:
  serve (default)     Start the web UI
  list                List all tasks
  add <task>          Add a task to Inbox
  start <id>          Move task to In Progress  
  done <id>           Mark task as done
  move <id> <column>  Move task to column

Options:
  --file <path>       Path to KANBAN.md (default: ./KANBAN.md)
  --port <number>     Web UI port (default: 5173)
  -h, --help          Show this help

Columns: inbox, today, progress, done

Examples:
  openclaw-kanban                              # Start web UI
  openclaw-kanban list                         # Show all tasks
  openclaw-kanban add "Review PR #123"         # Add to Inbox
  openclaw-kanban add "Fix bug" --to today     # Add to Today
  openclaw-kanban start 3                      # Move task 3 to In Progress
  openclaw-kanban done 3                       # Mark task 3 as Done
  openclaw-kanban move 2 today                 # Move task 2 to Today

Agent Usage:
  Agents can directly edit KANBAN.md or use these CLI commands.
  The file format is simple markdown with columns as headers.
`)
}

async function cmdList() {
  await ensureFile()
  const content = await readFile(absolutePath, 'utf-8')
  const columns = parseKanban(content)
  
  console.log(`📋 KANBAN (${absolutePath})\n`)
  
  for (const [name, tasks] of Object.entries(columns)) {
    const icon = name === 'Inbox' ? '📥' : name === 'Today' ? '🎯' : name === 'In Progress' ? '🔄' : '✅'
    console.log(`${icon} ${name}`)
    if (tasks.length === 0) {
      console.log('   (empty)')
    } else {
      for (const task of tasks) {
        const statusIcon = task.status === 'x' ? '✓' : task.status === '~' ? '◐' : '○'
        console.log(`   ${statusIcon} [${task.id}] ${task.text}`)
      }
    }
    console.log()
  }
}

async function cmdAdd() {
  // Find task text and target column from remaining args
  const addArgs = args.slice(args.indexOf('add') + 1)
  let taskText = ''
  let targetColumn = 'Inbox'
  
  for (let j = 0; j < addArgs.length; j++) {
    if (addArgs[j] === '--to' && addArgs[j + 1]) {
      const col = addArgs[j + 1].toLowerCase()
      if (COLUMNS[col]) {
        targetColumn = COLUMNS[col]
      }
      j++
    } else if (!addArgs[j].startsWith('--')) {
      taskText = addArgs[j]
    }
  }
  
  if (!taskText) {
    console.error('❌ Missing task text. Usage: openclaw-kanban add "task description"')
    process.exit(1)
  }
  
  await ensureFile()
  const content = await readFile(absolutePath, 'utf-8')
  const columns = parseKanban(content)
  
  columns[targetColumn].push({
    id: 0,
    status: ' ',
    text: taskText
  })
  
  await writeFile(absolutePath, serializeKanban(columns), 'utf-8')
  console.log(`✅ Added to ${targetColumn}: ${taskText}`)
}

async function cmdStart() {
  const startArgs = args.slice(args.indexOf('start') + 1)
  const taskId = parseInt(startArgs[0], 10)
  
  if (!taskId) {
    console.error('❌ Missing task ID. Usage: openclaw-kanban start <id>')
    process.exit(1)
  }
  
  await moveTask(taskId, 'In Progress', '~')
}

async function cmdDone() {
  const doneArgs = args.slice(args.indexOf('done') + 1)
  const taskId = parseInt(doneArgs[0], 10)
  
  if (!taskId) {
    console.error('❌ Missing task ID. Usage: openclaw-kanban done <id>')
    process.exit(1)
  }
  
  await moveTask(taskId, 'Done', 'x')
}

async function cmdMove() {
  const moveArgs = args.slice(args.indexOf('move') + 1)
  const taskId = parseInt(moveArgs[0], 10)
  const targetCol = moveArgs[1]?.toLowerCase()
  
  if (!taskId || !targetCol) {
    console.error('❌ Usage: openclaw-kanban move <id> <column>')
    process.exit(1)
  }
  
  const column = COLUMNS[targetCol]
  if (!column) {
    console.error(`❌ Unknown column: ${targetCol}. Valid: inbox, today, progress, done`)
    process.exit(1)
  }
  
  await moveTask(taskId, column)
}

async function moveTask(taskId, targetColumn, newStatus = null) {
  await ensureFile()
  const content = await readFile(absolutePath, 'utf-8')
  const columns = parseKanban(content)
  
  // Find and remove task from current column
  let task = null
  for (const [name, tasks] of Object.entries(columns)) {
    const idx = tasks.findIndex(t => t.id === taskId)
    if (idx !== -1) {
      task = tasks.splice(idx, 1)[0]
      break
    }
  }
  
  if (!task) {
    console.error(`❌ Task #${taskId} not found`)
    process.exit(1)
  }
  
  // Update status if specified
  if (newStatus) {
    task.status = newStatus
  }
  
  // Add timestamp for Done
  if (targetColumn === 'Done' && !task.text.includes('Completed:')) {
    const now = new Date().toISOString().split('T')[0]
    task.text = task.text.replace(/\s*$/, '')
    if (!task.text.includes('\n')) {
      task.text += `\n  - Completed: ${now}`
    }
  }
  
  // Add to target column
  columns[targetColumn].push(task)
  
  await writeFile(absolutePath, serializeKanban(columns), 'utf-8')
  console.log(`✅ Moved task #${taskId} to ${targetColumn}`)
}

async function cmdServe() {
  await ensureFile()
  
  console.log(`
📋 OpenClaw Kanban
`)
  console.log(`📄 Using: ${absolutePath}`)
  
  // Start file server
  const fileServer = createServer(async (req, res) => {
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
    console.log(`🔄 File sync: http://localhost:${fileServerPort}`)
  })
  
  // Serve static files
  const distPath = join(__dirname, '..', 'dist')
  
  try {
    await access(distPath)
    
    const { stat } = await import('fs/promises')
    
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
    }
    
    const staticServer = createServer(async (req, res) => {
      let reqPath = req.url === '/' ? '/index.html' : req.url
      const fullPath = join(distPath, reqPath)
      
      try {
        const stats = await stat(fullPath)
        if (stats.isDirectory()) {
          reqPath = join(reqPath, 'index.html')
        }
        
        const content = await readFile(join(distPath, reqPath))
        const ext = reqPath.substring(reqPath.lastIndexOf('.'))
        const contentType = mimeTypes[ext] || 'application/octet-stream'
        
        res.writeHead(200, { 'Content-Type': contentType })
        res.end(content)
      } catch {
        try {
          const content = await readFile(join(distPath, 'index.html'))
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
  
  process.on('SIGINT', () => {
    console.log('\n👋 Shutting down...')
    process.exit(0)
  })
}

// Run command
switch (command) {
  case 'help':
    await cmdHelp()
    break
  case 'list':
    await cmdList()
    break
  case 'add':
    await cmdAdd()
    break
  case 'start':
    await cmdStart()
    break
  case 'done':
    await cmdDone()
    break
  case 'move':
    await cmdMove()
    break
  case 'serve':
  default:
    await cmdServe()
    break
}

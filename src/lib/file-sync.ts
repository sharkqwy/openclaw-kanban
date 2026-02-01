/**
 * File sync utilities for KANBAN.md
 * 
 * Supports two modes:
 * 1. Server mode: Fetch/POST to localhost server
 * 2. File System Access API: Direct file access (modern browsers)
 */

export interface FileSyncConfig {
  /** Server URL for file operations */
  serverUrl?: string
  /** File path for KANBAN.md */
  filePath: string
}

export interface FileSyncResult {
  success: boolean
  content?: string
  error?: string
}

// Default config
const DEFAULT_CONFIG: FileSyncConfig = {
  serverUrl: 'http://localhost:18790', // OpenClaw kanban server
  filePath: 'KANBAN.md',
}

let config = { ...DEFAULT_CONFIG }
let fileHandle: FileSystemFileHandle | null = null

/**
 * Configure the file sync
 */
export function configureSync(newConfig: Partial<FileSyncConfig>) {
  config = { ...config, ...newConfig }
}

/**
 * Read KANBAN.md content
 */
export async function readFile(): Promise<FileSyncResult> {
  // Try File System Access API first (if we have a handle)
  if (fileHandle) {
    try {
      const file = await fileHandle.getFile()
      const content = await file.text()
      return { success: true, content }
    } catch (err) {
      console.warn('File handle read failed, trying server:', err)
    }
  }
  
  // Fall back to server
  if (config.serverUrl) {
    try {
      const res = await fetch(`${config.serverUrl}/read?path=${encodeURIComponent(config.filePath)}`)
      if (res.ok) {
        const content = await res.text()
        return { success: true, content }
      }
      // 404 = file doesn't exist yet, that's okay
      if (res.status === 404) {
        return { success: false, error: 'File not found' }
      }
      return { success: false, error: `Server error: ${res.status}` }
    } catch (err) {
      return { success: false, error: `Network error: ${err}` }
    }
  }
  
  return { success: false, error: 'No file access method available' }
}

/**
 * Write content to KANBAN.md
 */
export async function writeFile(content: string): Promise<FileSyncResult> {
  // Try File System Access API first
  if (fileHandle) {
    try {
      const writable = await fileHandle.createWritable()
      await writable.write(content)
      await writable.close()
      return { success: true }
    } catch (err) {
      console.warn('File handle write failed, trying server:', err)
    }
  }
  
  // Fall back to server
  if (config.serverUrl) {
    try {
      const res = await fetch(`${config.serverUrl}/write?path=${encodeURIComponent(config.filePath)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: content,
      })
      if (res.ok) {
        return { success: true }
      }
      return { success: false, error: `Server error: ${res.status}` }
    } catch (err) {
      return { success: false, error: `Network error: ${err}` }
    }
  }
  
  return { success: false, error: 'No file access method available' }
}

/**
 * Open file picker (File System Access API)
 * Returns true if a file was selected
 */
export async function openFilePicker(): Promise<boolean> {
  if (!('showOpenFilePicker' in window)) {
    return false
  }
  
  try {
    const [handle] = await (window as any).showOpenFilePicker({
      types: [{
        description: 'Markdown files',
        accept: { 'text/markdown': ['.md'] },
      }],
    })
    fileHandle = handle
    return true
  } catch (err) {
    // User cancelled
    return false
  }
}

/**
 * Create new file (File System Access API)
 */
export async function createNewFile(defaultContent: string): Promise<boolean> {
  if (!('showSaveFilePicker' in window)) {
    return false
  }
  
  try {
    const handle = await (window as any).showSaveFilePicker({
      suggestedName: 'KANBAN.md',
      types: [{
        description: 'Markdown files',
        accept: { 'text/markdown': ['.md'] },
      }],
    })
    fileHandle = handle
    
    const writable = await handle.createWritable()
    await writable.write(defaultContent)
    await writable.close()
    
    return true
  } catch (err) {
    return false
  }
}

/**
 * Check if File System Access API is available
 */
export function hasFileSystemAccess(): boolean {
  return 'showOpenFilePicker' in window
}

/**
 * Check if we have a file handle
 */
export function hasFileHandle(): boolean {
  return fileHandle !== null
}

/**
 * Clear file handle
 */
export function clearFileHandle() {
  fileHandle = null
}

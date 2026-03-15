import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, FileText, Folder, FolderOpen, ChevronRight, ChevronDown,
  BookOpen, AlertTriangle, Clock, PanelLeftClose, PanelLeftOpen, ChevronLeft,
} from 'lucide-react';
import { LearningsDashboard } from './LearningsDashboard';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, parseISO } from 'date-fns';

// ─── Types ───────────────────────────────────────────────
interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
  modifiedAt?: string;
}

interface DocResult {
  path: string;
  content: string;
  modifiedAt: string;
}

interface SearchResult {
  path: string;
  name: string;
  matches: string[];
}

interface InsightEntry {
  folder: string;
  count: number;
  lastUpdated: string | null;
  stale: boolean;
}

// ─── Markdown Renderer ──────────────────────────────────
function renderMarkdown(content: string, onNavigate: (path: string) => void): React.ReactNode[] {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];
  // codeLang reserved for future syntax highlighting

  const processInline = (text: string, key: string): React.ReactNode => {
    // Wiki links
    const parts: React.ReactNode[] = [];
    const wikiRe = /\[\[([^\]]+)\]\]/g;
    let last = 0;
    let match;
    let idx = 0;
    while ((match = wikiRe.exec(text)) !== null) {
      if (match.index > last) {
        parts.push(formatInline(text.slice(last, match.index), `${key}-t${idx}`));
      }
      const target = match[1];
      parts.push(
        <button
          key={`${key}-wl${idx}`}
          onClick={() => {
            // Try to find the doc by searching common paths
            const candidates = [
              `concepts/${target}.md`,
              `decisions/${target}.md`,
              `projects/${target}.md`,
              `journals/${target}.md`,
              `${target}.md`,
            ];
            // Navigate to first candidate — the fetch will handle 404
            onNavigate(candidates[0]);
          }}
          className="text-accent hover:text-accent-hover underline underline-offset-2 decoration-accent/40 hover:decoration-accent transition-colors"
        >
          {target}
        </button>
      );
      last = match.index + match[0].length;
      idx++;
    }
    if (last < text.length) {
      parts.push(formatInline(text.slice(last), `${key}-end`));
    }
    return parts.length === 1 ? parts[0] : <>{parts}</>;
  };

  const formatInline = (text: string, key: string): React.ReactNode => {
    // Bold, italic, inline code
    const formatted = text
      .replace(/`([^`]+)`/g, '⌘CODE_START⌘$1⌘CODE_END⌘')
      .replace(/\*\*([^*]+)\*\*/g, '⌘BOLD_START⌘$1⌘BOLD_END⌘')
      .replace(/\*([^*]+)\*/g, '⌘ITALIC_START⌘$1⌘ITALIC_END⌘');

    const segments: React.ReactNode[] = [];
    const tokenRe = /⌘(CODE_START|CODE_END|BOLD_START|BOLD_END|ITALIC_START|ITALIC_END)⌘/g;
    let segIdx = 0;
    const tokens: { type: string; index: number }[] = [];
    let m;
    while ((m = tokenRe.exec(formatted)) !== null) {
      tokens.push({ type: m[1], index: m.index });
    }

    let pos = 0;
    for (const token of tokens) {
      if (token.index > pos) {
        segments.push(<span key={`${key}-s${segIdx++}`}>{formatted.slice(pos, token.index)}</span>);
      }
      pos = token.index + token.type.length + 2; // ⌘ chars
    }

    // Simpler approach: just use dangerouslySetInnerHTML-free rendering
    if (tokens.length === 0) return <span key={key}>{text}</span>;

    // Fallback: render with basic replacements
    const remaining = text;
    let pIdx = 0;

    // Inline code
    const codeRe = /`([^`]+)`/g;
    let cLast = 0;
    const codeParts: React.ReactNode[] = [];
    let cMatch;
    while ((cMatch = codeRe.exec(remaining)) !== null) {
      if (cMatch.index > cLast) codeParts.push(remaining.slice(cLast, cMatch.index));
      codeParts.push(
        <code key={`${key}-c${pIdx++}`} className="px-1.5 py-0.5 bg-bg-elevated rounded text-[11px] font-mono text-accent/80">
          {cMatch[1]}
        </code>
      );
      cLast = cMatch.index + cMatch[0].length;
    }
    if (codeParts.length > 0) {
      if (cLast < remaining.length) codeParts.push(remaining.slice(cLast));
      return <>{codeParts}</>;
    }

    return <span key={key}>{text}</span>;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${i}`} className="bg-bg-deep border border-border-subtle rounded-lg p-3 my-2 overflow-x-auto">
            <code className="text-[11px] font-mono text-text-secondary leading-relaxed">
              {codeLines.join('\n')}
            </code>
          </pre>
        );
        codeLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        // codeLang = line.slice(3).trim(); // reserved for syntax highlighting
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-[18px] font-bold text-text-primary mt-4 mb-2">{processInline(line.slice(2), `h1-${i}`)}</h1>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-[15px] font-semibold text-text-primary mt-3 mb-1.5">{processInline(line.slice(3), `h2-${i}`)}</h2>);
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-[13px] font-semibold text-text-secondary mt-2 mb-1">{processInline(line.slice(4), `h3-${i}`)}</h3>);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <li key={i} className="text-[12px] text-text-secondary ml-4 list-disc leading-relaxed">
          {processInline(line.slice(2), `li-${i}`)}
        </li>
      );
    } else if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={i} className="border-l-2 border-accent/40 pl-3 my-1 text-[12px] text-text-muted italic">
          {processInline(line.slice(2), `bq-${i}`)}
        </blockquote>
      );
    } else if (line.startsWith('---')) {
      elements.push(<hr key={i} className="border-border-subtle my-3" />);
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(<p key={i} className="text-[12px] text-text-secondary leading-relaxed">{processInline(line, `p-${i}`)}</p>);
    }
  }

  return elements;
}

// ─── File Tree Item ─────────────────────────────────────
function TreeItem({ node, selectedPath, onSelect, onFolderSelect, depth = 0 }: {
  node: TreeNode;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  onFolderSelect?: (path: string) => void;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(depth === 0);
  const isFolder = node.type === 'folder';
  const isSelected = node.path === selectedPath;

  return (
    <div>
      <button
        onClick={() => {
          if (isFolder) {
            setExpanded(!expanded);
            if (onFolderSelect) onFolderSelect(node.path);
          } else {
            onSelect(node.path);
          }
        }}
        className={`w-full flex items-center gap-1.5 px-2 py-[5px] text-[11px] rounded-md transition-colors ${
          isSelected
            ? 'bg-accent/15 text-accent'
            : 'text-text-muted hover:text-text-secondary hover:bg-bg-elevated/50'
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {isFolder ? (
          <>
            {expanded ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
            {expanded ? <FolderOpen className="w-3 h-3 shrink-0 text-accent/60" /> : <Folder className="w-3 h-3 shrink-0 text-accent/60" />}
          </>
        ) : (
          <>
            <span className="w-3" />
            <FileText className="w-3 h-3 shrink-0 text-text-muted" />
          </>
        )}
        <span className="truncate">{node.name.replace(/\.md$/, '')}</span>
      </button>
      <AnimatePresence>
        {isFolder && expanded && node.children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            {node.children.map((child) => (
              <TreeItem key={child.path} node={child} selectedPath={selectedPath} onSelect={onSelect} onFolderSelect={onFolderSelect} depth={depth + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Journal Calendar ───────────────────────────────────
function JournalCalendar({ journalFiles, onSelect, selectedPath }: {
  journalFiles: TreeNode[];
  onSelect: (path: string) => void;
  selectedPath: string | null;
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);

  const journalDates = useMemo(() => {
    const map = new Map<string, string>();
    for (const f of journalFiles) {
      const dateStr = f.name.replace('.md', '');
      map.set(dateStr, f.path);
    }
    return map;
  }, [journalFiles]);

  return (
    <div className="p-2 border-t border-border-subtle">
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          className="p-1 text-text-muted hover:text-text-secondary">
          <ChevronLeft className="w-3 h-3" />
        </button>
        <span className="text-[10px] font-medium text-text-secondary">{format(currentMonth, 'MMM yyyy')}</span>
        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          className="p-1 text-text-muted hover:text-text-secondary">
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-[2px] text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <span key={i} className="text-[8px] text-text-muted font-medium">{d}</span>
        ))}
        {Array(startDay).fill(null).map((_, i) => <span key={`e-${i}`} />)}
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const hasJournal = journalDates.has(dateStr);
          const journalPath = journalDates.get(dateStr);
          const isSelected = journalPath === selectedPath;
          return (
            <button
              key={dateStr}
              onClick={() => hasJournal && journalPath && onSelect(journalPath)}
              disabled={!hasJournal}
              className={`text-[9px] py-[2px] rounded transition-colors ${
                isSelected ? 'bg-accent text-bg-deep font-bold' :
                hasJournal ? 'text-accent hover:bg-accent/15 font-medium cursor-pointer' :
                'text-text-muted/30'
              }`}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Insights Panel ─────────────────────────────────────
function InsightsPanel({ insights }: { insights: InsightEntry[] }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border-t border-border-subtle">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-[10px] text-text-muted hover:text-text-secondary"
      >
        <span className="font-medium uppercase tracking-wider">Insights</span>
        {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden px-3 pb-2 space-y-1.5"
          >
            {insights.map((ins) => (
              <div key={ins.folder} className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5">
                  <Folder className="w-2.5 h-2.5 text-accent/50" />
                  <span className="text-text-secondary capitalize">{ins.folder}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-text-muted">{ins.count} docs</span>
                  {ins.stale && <AlertTriangle className="w-2.5 h-2.5 text-warning" />}
                  {ins.lastUpdated && (
                    <span className="text-text-muted/60">{format(parseISO(ins.lastUpdated), 'MMM d')}</span>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────
export function KnowledgeView() {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [doc, setDoc] = useState<DocResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [insights, setInsights] = useState<InsightEntry[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [, setLoading] = useState(false);
  const [showLearningsDashboard, setShowLearningsDashboard] = useState(false);

  // Load tree + insights
  useEffect(() => {
    fetch('/api/knowledge/tree').then(r => r.json()).then(setTree).catch(() => {});
    fetch('/api/knowledge/insights').then(r => r.json()).then(setInsights).catch(() => {});
  }, []);

  // Load document
  const loadDoc = useCallback(async (path: string) => {
    setSelectedPath(path);
    setSearchResults(null);
    setShowLearningsDashboard(false);
    setLoading(true);
    try {
      const res = await fetch(`/api/knowledge/doc?path=${encodeURIComponent(path)}`);
      if (res.ok) {
        setDoc(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle learnings folder click
  const handleSelect = useCallback((path: string) => {
    if (path === '__learnings__') {
      setShowLearningsDashboard(true);
      setSelectedPath('__learnings__');
      setDoc(null);
      setSearchResults(null);
      return;
    }
    setShowLearningsDashboard(false);
    loadDoc(path);
  }, [loadDoc]);

  // Search
  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults(null); return; }
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/knowledge/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(await res.json());
      } catch { /* ignore */ }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Find journal files for calendar
  const journalFiles = useMemo(() => {
    const journalsFolder = tree.find(n => n.name === 'journals');
    return journalsFolder?.children ?? [];
  }, [tree]);

  // Check if selected doc is in journals
  // isInJournals reserved for future journal-specific UI

  // Breadcrumb
  const breadcrumb = selectedPath?.split('/') ?? [];

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 240, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col border-r border-border-subtle bg-bg-surface/40 overflow-hidden shrink-0"
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border-subtle">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-accent" />
                <span className="text-[11px] font-semibold text-text-primary">Knowledge</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1 text-text-muted hover:text-text-secondary">
                <PanelLeftClose className="w-3 h-3" />
              </button>
            </div>

            {/* File Tree */}
            <div className="flex-1 overflow-y-auto py-1">
              {tree.map((node) => (
                <TreeItem key={node.path} node={node} selectedPath={selectedPath} onSelect={handleSelect} onFolderSelect={handleSelect} />
              ))}
              {tree.length === 0 && (
                <div className="px-3 py-4 text-[11px] text-text-muted text-center">
                  No knowledge base found
                </div>
              )}
            </div>

            {/* Journal Calendar (show when journals exist) */}
            {journalFiles.length > 0 && (
              <JournalCalendar journalFiles={journalFiles} onSelect={loadDoc} selectedPath={selectedPath} />
            )}

            {/* Insights */}
            {insights.length > 0 && <InsightsPanel insights={insights} />}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-border-subtle bg-bg-surface/30">
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} className="p-1 text-text-muted hover:text-text-secondary">
              <PanelLeftOpen className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-[11px] text-text-muted min-w-0">
            <BookOpen className="w-3 h-3 shrink-0" />
            {breadcrumb.map((part, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="w-2.5 h-2.5" />}
                <span className={i === breadcrumb.length - 1 ? 'text-text-secondary' : ''}>{part.replace('.md', '')}</span>
              </span>
            ))}
          </div>

          <div className="flex-1" />

          {/* Search */}
          <div className="relative w-[240px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search knowledge base..."
              className="w-full pl-7 pr-3 py-1.5 bg-bg-deep border border-border-subtle rounded-lg text-[11px] text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent/40 transition-colors"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {/* Learnings Dashboard */}
          {showLearningsDashboard ? (
            <LearningsDashboard />
          ) : searchResults !== null ? (
            <div className="max-w-3xl mx-auto p-6">
              <h2 className="text-[13px] font-semibold text-text-primary mb-3">
                Search results for &ldquo;{searchQuery}&rdquo;
              </h2>
              {searchResults.length === 0 ? (
                <p className="text-[12px] text-text-muted">No results found.</p>
              ) : (
                <div className="space-y-3">
                  {searchResults.map((r) => (
                    <button
                      key={r.path}
                      onClick={() => { loadDoc(r.path); setSearchQuery(''); }}
                      className="w-full text-left p-3 bg-bg-surface border border-border-subtle rounded-lg hover:border-accent/30 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-3 h-3 text-accent/60" />
                        <span className="text-[12px] font-medium text-text-primary">{r.name}</span>
                        <span className="text-[10px] text-text-muted">{r.path}</span>
                      </div>
                      {r.matches.map((m, i) => (
                        <p key={i} className="text-[11px] text-text-muted truncate">{m}</p>
                      ))}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : doc ? (
            <motion.div
              key={doc.path}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="max-w-3xl mx-auto p-6"
            >
              {/* Doc metadata */}
              <div className="flex items-center gap-2 mb-4 text-[10px] text-text-muted">
                <Clock className="w-3 h-3" />
                <span>Last modified {doc.modifiedAt ? format(parseISO(doc.modifiedAt), 'MMM d, yyyy HH:mm') : 'unknown'}</span>
              </div>
              {/* Markdown content */}
              <div className="prose-dark space-y-0.5">
                {renderMarkdown(doc.content, loadDoc)}
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex items-center justify-center h-full">
              <div className="text-center">
                <BookOpen className="w-8 h-8 text-text-muted/20 mx-auto mb-3" />
                <p className="text-[13px] text-text-muted">Select a document from the tree</p>
                <p className="text-[11px] text-text-muted/60 mt-1">Browse your second brain and learnings</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Inbox, FolderKanban, MessageSquare, Send, RefreshCw } from 'lucide-react';
import { API } from '@/App';

/**
 * Admin → Messages Inbox
 *
 * Two routes:
 *   • Support           — global thread, no project context (route="support")
 *   • Project moderation — per-project threads (route="project")
 *
 * Wired against the new backend endpoints introduced for sequence-defining
 * messaging:
 *   GET  /api/admin/messages/inbox?route=support|project
 *   GET  /api/admin/messages/thread/:thread_id
 *   POST /api/admin/messages/thread/:thread_id/reply
 *
 * The mobile client posts via /chat/message, which now routes by project_id;
 * the previous "Got it — I'm on it" bot mock is gone — admin replies show up
 * in the same client thread immediately.
 */

const ROUTES = [
  { key: 'support', label: 'Support', icon: Inbox },
  { key: 'project', label: 'Project moderation', icon: FolderKanban },
];

function relTime(iso) {
  if (!iso) return '';
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function AdminInboxPage() {
  const [route, setRoute] = useState('support');
  const [threads, setThreads] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [thread, setThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const feedRef = useRef(null);

  const cfg = useMemo(() => {
    const tok = localStorage.getItem('token');
    return tok ? { headers: { Authorization: `Bearer ${tok}` }, withCredentials: true } : { withCredentials: true };
  }, []);

  const loadThreads = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/admin/messages/inbox?route=${route}`, cfg);
      setThreads(r.data?.threads || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadThreads();
    const i = setInterval(loadThreads, 8000);
    return () => clearInterval(i);
  }, [route]);

  const openThread = async (id) => {
    setActiveId(id);
    try {
      const r = await axios.get(`${API}/admin/messages/thread/${id}`, cfg);
      setThread(r.data?.thread || null);
      setMessages(r.data?.messages || []);
      setTimeout(() => {
        if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
      }, 50);
    } catch {
      setThread(null);
      setMessages([]);
    }
  };

  const send = async () => {
    const text = reply.trim();
    if (!text || !activeId) return;
    setSending(true);
    try {
      const r = await axios.post(`${API}/admin/messages/thread/${activeId}/reply`, { text }, cfg);
      const m = r.data?.message;
      if (m) setMessages((prev) => [...prev, m]);
      setReply('');
      // refresh thread index so the list reflects new last_message_preview
      loadThreads();
      setTimeout(() => {
        if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
      }, 50);
    } finally {
      setSending(false);
    }
  };

  const totalUnread = useMemo(
    () => threads.reduce((s, t) => s + (t.unread_admin || 0), 0),
    [threads]
  );

  return (
    <div className="flex flex-col h-screen" data-testid="admin-inbox">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" />
            Messages
            {totalUnread > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-bold">
                {totalUnread} unread
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live inbox · client → admin routing by support / project
          </p>
        </div>
        <button
          onClick={loadThreads}
          className="p-2 rounded-lg hover:bg-white/5 transition"
          data-testid="admin-inbox-refresh"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Route tabs */}
      <div className="flex gap-1 px-6 py-3 border-b border-border bg-background">
        {ROUTES.map((r) => {
          const Icon = r.icon;
          const active = route === r.key;
          return (
            <button
              key={r.key}
              onClick={() => { setRoute(r.key); setActiveId(null); setThread(null); setMessages([]); }}
              data-testid={`admin-inbox-tab-${r.key}`}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                active
                  ? 'bg-primary/10 text-primary border border-primary/30'
                  : 'text-muted-foreground hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              {r.label}
            </button>
          );
        })}
      </div>

      {/* Body: threads list + active thread feed */}
      <div className="flex-1 flex overflow-hidden">
        {/* Threads list */}
        <div className="w-[340px] border-r border-border overflow-y-auto bg-card/30">
          {threads.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              {loading ? 'Loading…' : `No ${route === 'support' ? 'support' : 'project'} threads yet.`}
            </div>
          ) : (
            threads.map((t) => {
              const active = activeId === t.thread_id;
              const unread = (t.unread_admin || 0) > 0;
              return (
                <button
                  key={t.thread_id}
                  onClick={() => openThread(t.thread_id)}
                  data-testid={`admin-inbox-thread-${t.thread_id}`}
                  className={`w-full text-left px-4 py-3 border-b border-border/50 transition ${
                    active ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-semibold truncate ${unread ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {t.client_name || t.client_email || '—'}
                    </span>
                    {unread && (
                      <span className="ml-2 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-background text-[10px] font-bold flex items-center justify-center">
                        {t.unread_admin}
                      </span>
                    )}
                  </div>
                  {t.route === 'project' && (
                    <div className="text-[11px] text-primary/80 mb-1 truncate">
                      📁 {t.project_title || t.project_id}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    {t.last_direction === 'admin_to_client' && <span className="text-primary">↩ </span>}
                    {t.last_message_preview || '—'}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {relTime(t.last_message_at)} · {t.total_messages || 0} msg
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Active thread */}
        <div className="flex-1 flex flex-col">
          {!activeId ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <div>Pick a thread to read and reply.</div>
              </div>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="px-6 py-4 border-b border-border bg-card/40">
                <div className="font-semibold">{thread?.client_name || thread?.client_email || '—'}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {thread?.client_email} · {thread?.route === 'project'
                    ? `Project: ${thread?.project_title || thread?.project_id}`
                    : 'General support'}
                </div>
              </div>

              {/* Messages */}
              <div ref={feedRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-background">
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    No messages in this thread.
                  </div>
                )}
                {messages.map((m) => {
                  const isAdmin = m.direction === 'admin_to_client';
                  return (
                    <div
                      key={m.id}
                      data-testid={`admin-inbox-msg-${m.id}`}
                      className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                          isAdmin
                            ? 'bg-primary/15 border border-primary/30 text-foreground'
                            : 'bg-card border border-border text-foreground'
                        }`}
                      >
                        <div className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${
                          isAdmin ? 'text-primary' : 'text-muted-foreground'
                        }`}>
                          {isAdmin ? `Admin · ${m.admin_name || 'You'}` : (m.user_name || 'Client')}
                        </div>
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</div>
                        <div className="text-[10px] text-muted-foreground mt-1">
                          {relTime(m.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply box */}
              <div className="border-t border-border p-4 bg-card/40">
                <div className="flex gap-2 items-end">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder={`Reply to ${thread?.client_name || 'client'}…`}
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none min-h-[44px] max-h-[140px] focus:outline-none focus:ring-2 focus:ring-primary/40"
                    data-testid="admin-inbox-reply-input"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send();
                    }}
                  />
                  <button
                    onClick={send}
                    disabled={!reply.trim() || sending}
                    data-testid="admin-inbox-reply-send"
                    className="px-4 py-2.5 rounded-lg bg-primary text-background font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 hover:bg-primary/90 transition"
                  >
                    {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send
                  </button>
                </div>
                <div className="text-[10px] text-muted-foreground mt-1.5">
                  ⌘/Ctrl + Enter to send
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

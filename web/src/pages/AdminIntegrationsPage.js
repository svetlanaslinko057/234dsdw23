import { useState, useEffect, useCallback } from 'react';
import { useAuth, API } from '@/App';
import axios from 'axios';
import {
  Key, Loader2, CheckCircle2, XCircle, Save, Zap, Eye, EyeOff,
  AlertCircle, Sparkles, Globe, Shield,
} from 'lucide-react';

const CLIENT_PROVIDERS = [
  { id: 'openai',   label: 'OpenAI',          desc: 'Direct OpenAI API (sk-…)',              recommended: true },
  { id: 'emergent', label: 'MRGate (Emergent)', desc: 'Emergent Universal Key — fallback',   recommended: false },
];

const MODEL_OPTIONS = [
  'gpt-4o-mini',
  'gpt-4o',
  'gpt-4.1-mini',
  'gpt-4.1',
  'o1-mini',
];

export default function AdminIntegrationsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showOpenai, setShowOpenai] = useState(false);
  const [showEmergent, setShowEmergent] = useState(false);

  const [openaiInput, setOpenaiInput] = useState('');
  const [emergentInput, setEmergentInput] = useState('');
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('gpt-4o-mini');
  const [msg, setMsg] = useState(null); // { type: 'ok'|'err', text }

  const fetchSettings = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/admin/settings/llm`, { withCredentials: true });
      setSettings(r.data);
      setProvider(r.data.preferred_provider || 'auto');
      setModel(r.data.default_model || 'gpt-4o-mini');
    } catch (e) {
      setMsg({ type: 'err', text: e?.response?.data?.detail || 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const saveKeys = async () => {
    setSaving(true);
    setMsg(null);
    const body = {
      preferred_provider: provider,
      default_model: model,
    };
    // Only send fields the admin actually typed — empty string also allowed to clear
    if (openaiInput !== '') body.openai_api_key = openaiInput;
    if (emergentInput !== '') body.emergent_llm_key = emergentInput;

    try {
      const r = await axios.put(`${API}/admin/settings/llm`, body, { withCredentials: true });
      setSettings(r.data);
      setOpenaiInput('');
      setEmergentInput('');
      setMsg({ type: 'ok', text: 'Settings saved. AI features will now use the new key.' });
    } catch (e) {
      setMsg({ type: 'err', text: e?.response?.data?.detail || 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const r = await axios.post(`${API}/admin/settings/llm/test`, {}, { withCredentials: true });
      setTestResult(r.data);
    } catch (e) {
      setTestResult({ ok: false, error: e?.response?.data?.detail || 'Request failed' });
    } finally {
      setTesting(false);
    }
  };

  const clearKey = async (which) => {
    if (!window.confirm(`Clear the stored ${which === 'openai' ? 'OpenAI' : 'Emergent'} key?`)) return;
    setSaving(true);
    try {
      const body = which === 'openai' ? { openai_api_key: '' } : { emergent_llm_key: '' };
      const r = await axios.put(`${API}/admin/settings/llm`, body, { withCredentials: true });
      setSettings(r.data);
      setMsg({ type: 'ok', text: 'Key cleared.' });
    } catch (e) {
      setMsg({ type: 'err', text: 'Clear failed' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-red-400">
          <Shield className="w-5 h-5" /> Admin access required
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl" data-testid="admin-integrations-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Key className="w-6 h-6 text-blue-400" />
          <div>
            <h1 className="text-2xl font-semibold">Integrations &amp; Keys</h1>
            <p className="text-sm text-muted-foreground">
              Configure LLM providers for Estimate AI, scope generation, and operator brains.
            </p>
          </div>
        </div>
        <button
          onClick={runTest}
          disabled={testing || !settings?.active_provider}
          data-testid="llm-test-btn"
          className="inline-flex items-center gap-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-40 px-4 py-2 text-sm font-medium text-white"
        >
          {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          Test connection
        </button>
      </div>

      {/* Status */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Active provider</div>
          {settings?.active_provider ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-900/40 border border-emerald-700/50 px-3 py-1 text-xs font-medium text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {settings.active_provider === 'openai' ? 'OpenAI' : 'MRGate'} · {settings.default_model}
              {settings.active_source && (
                <span className="opacity-60 ml-1">({settings.active_source})</span>
              )}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-900/40 border border-amber-700/50 px-3 py-1 text-xs font-medium text-amber-300">
              <AlertCircle className="w-3.5 h-3.5" /> No key configured · AI features disabled
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center justify-between rounded bg-muted/40 px-3 py-2">
            <span>OpenAI (stored)</span>
            <span className="font-mono">{settings?.openai?.configured ? settings.openai.masked : '—'}</span>
          </div>
          <div className="flex items-center justify-between rounded bg-muted/40 px-3 py-2">
            <span>Emergent (stored)</span>
            <span className="font-mono">{settings?.emergent?.configured ? settings.emergent.masked : '—'}</span>
          </div>
          <div className="flex items-center justify-between rounded bg-muted/40 px-3 py-2">
            <span>Env fallback: OpenAI</span>
            <span>{settings?.env_fallback?.openai ? '✓' : '—'}</span>
          </div>
          <div className="flex items-center justify-between rounded bg-muted/40 px-3 py-2">
            <span>Env fallback: Emergent</span>
            <span>{settings?.env_fallback?.emergent ? '✓' : '—'}</span>
          </div>
        </div>
      </div>

      {testResult && (
        <div className={`rounded-xl border p-4 text-sm ${testResult.ok ? 'border-emerald-700/50 bg-emerald-900/30 text-emerald-200' : 'border-red-700/50 bg-red-900/30 text-red-200'}`}>
          {testResult.ok ? (
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium">Connection OK</div>
                <div className="text-xs opacity-80 mt-1">
                  Provider: {testResult.provider} · Model: {testResult.model} · Response: {testResult.response}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium">Connection failed</div>
                <div className="text-xs opacity-80 mt-1">{testResult.error}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {msg && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${msg.type === 'ok' ? 'border-emerald-700/50 bg-emerald-900/30 text-emerald-200' : 'border-red-700/50 bg-red-900/30 text-red-200'}`}>
          {msg.text}
        </div>
      )}

      {/* OpenAI block */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-green-400" />
          <h2 className="text-lg font-semibold">OpenAI</h2>
          {settings?.openai?.configured && (
            <span className="ml-auto text-xs text-muted-foreground">Current: {settings.openai.masked}</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Paste a raw OpenAI API key (starts with <code className="bg-muted px-1 py-0.5 rounded">sk-</code>).
          Get one at <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="underline">platform.openai.com/api-keys</a>.
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={showOpenai ? 'text' : 'password'}
              value={openaiInput}
              onChange={(e) => setOpenaiInput(e.target.value)}
              placeholder={settings?.openai?.configured ? '•••••••••• (leave empty to keep current)' : 'sk-proj-...'}
              data-testid="llm-openai-input"
              className="w-full rounded-lg bg-muted border border-border px-3 py-2 pr-10 text-sm font-mono"
            />
            <button
              type="button"
              onClick={() => setShowOpenai(!showOpenai)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showOpenai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {settings?.openai?.configured && (
            <button
              onClick={() => clearKey('openai')}
              className="px-3 py-2 text-xs text-red-300 hover:text-red-200 hover:bg-red-900/30 rounded-lg border border-red-800/50"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Emergent block */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold">MRGate (Emergent Universal Key)</h2>
          {settings?.emergent?.configured && (
            <span className="ml-auto text-xs text-muted-foreground">Current: {settings.emergent.masked}</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Alternative: one key for OpenAI + Anthropic + Gemini via Emergent proxy. Get it from your Emergent profile → Universal Key.
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={showEmergent ? 'text' : 'password'}
              value={emergentInput}
              onChange={(e) => setEmergentInput(e.target.value)}
              placeholder={settings?.emergent?.configured ? '•••••••••• (leave empty to keep current)' : 'emergent_...'}
              data-testid="llm-emergent-input"
              className="w-full rounded-lg bg-muted border border-border px-3 py-2 pr-10 text-sm font-mono"
            />
            <button
              type="button"
              onClick={() => setShowEmergent(!showEmergent)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showEmergent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {settings?.emergent?.configured && (
            <button
              onClick={() => clearKey('emergent')}
              className="px-3 py-2 text-xs text-red-300 hover:text-red-200 hover:bg-red-900/30 rounded-lg border border-red-800/50"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Provider & model — THE orchestrator switch */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Active LLM pipeline</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Which provider does the system use for Estimate AI, scope generation & operator brains?
            If the chosen provider's key is missing, the other one is used as fallback.
          </p>
        </div>
        <div>
          <div className="grid grid-cols-2 gap-3">
            {CLIENT_PROVIDERS.map(p => {
              const isActive = provider === p.id;
              const hasKey = p.id === 'openai' ? settings?.openai?.configured : settings?.emergent?.configured;
              return (
                <button
                  key={p.id}
                  data-testid={`llm-provider-${p.id}`}
                  onClick={() => setProvider(p.id)}
                  className={`text-left rounded-lg border p-4 transition relative ${isActive ? 'border-blue-500 bg-blue-950/40 ring-2 ring-blue-500/30' : 'border-border hover:border-muted-foreground'}`}
                >
                  {p.recommended && (
                    <span className="absolute top-2 right-2 text-[10px] uppercase tracking-wider font-semibold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded">
                      default
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isActive ? 'border-blue-400' : 'border-muted-foreground'}`}>
                      {isActive && <div className="w-2 h-2 rounded-full bg-blue-400" />}
                    </div>
                    <div className="font-semibold">{p.label}</div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">{p.desc}</div>
                  <div className="text-xs mt-2">
                    {hasKey
                      ? <span className="text-emerald-400">● Key configured</span>
                      : <span className="text-amber-400">● No key yet — fallback to other provider</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <div className="text-sm font-medium mb-2">Default model</div>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            data-testid="llm-model-select"
            className="w-full rounded-lg bg-muted border border-border px-3 py-2 text-sm"
          >
            {MODEL_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            Applies to both providers (Emergent proxies to OpenAI under the hood).
          </p>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={saveKeys}
          disabled={saving}
          data-testid="llm-save-btn"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 px-5 py-2.5 text-sm font-medium text-white"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save settings
        </button>
      </div>
    </div>
  );
}

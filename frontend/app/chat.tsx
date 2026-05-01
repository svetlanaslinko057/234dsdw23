import { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,
  TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../src/api';
import T from '../src/theme';
import { useRequireAuth } from '../src/auth-gate';
import { useAuth } from '../src/auth';
import { useMe } from '../src/use-me';

/**
 * Fullscreen chat. Single feed across system / action / money / user / support.
 *
 * Every system message can carry actions ([Approve] / [Pay now] / etc).
 * Quick commands are seeded ("add payments", "what's the status") so the input
 * area is never blank and the user always has somewhere to start.
 *
 * Deep-link: /chat?msg=<id> → after load, scrolls to that message.
 */

type ChatAction = { label: string; action: string; entity_id?: string };
type ChatMsg = {
  id: string;
  type: 'system' | 'action' | 'money' | 'user' | 'support';
  text: string;
  actions?: ChatAction[];
  project_id?: string | null;
  created_at?: string;
};

const QUICK = ['add payments', "what's the status", 'I want to scale'];

const TYPE_STYLE: Record<ChatMsg['type'], { bg: string; border: string; accent: string }> = {
  system:  { bg: '#1a2129', border: '#2b3947', accent: T.textMuted },
  action:  { bg: '#15201c', border: T.primary,  accent: T.primary },
  money:   { bg: '#1f1c10', border: '#F59E0B',  accent: '#F59E0B' },
  user:    { bg: '#0f2236', border: '#3B82F6',  accent: '#9CC4FF' },
  support: { bg: '#1f1430', border: '#A855F7',  accent: '#C7A6FF' },
};

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const requireAuth = useRequireAuth();
  const { msg: deeplinkId, project_id: pidParam, prefill: prefillParam, send: sendParam } = useLocalSearchParams<{ msg?: string; project_id?: string; prefill?: string; send?: string }>();

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  // Phase 2.A — one-shot referral system message after first paid invoice.
  const { me } = useMe();
  const [refAnnounce, setRefAnnounce] = useState<boolean>(false);

  // Decide whether to render the referral system bubble. Conditions:
  //   1. Backend says user is referral_eligible (paid >= 1 invoice).
  //   2. We have NOT shown it before on this device (AsyncStorage flag).
  // Once we show it AND the user navigates to /client/referrals OR
  // taps the close mark, the flag is persisted so it never re-appears.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!(me as any)?.referral_eligible) return;
        const seen = await AsyncStorage.getItem('eva_chat_referral_announced');
        if (!cancelled && !seen) setRefAnnounce(true);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [me]);

  const dismissReferralAnnounce = async () => {
    setRefAnnounce(false);
    try { await AsyncStorage.setItem('eva_chat_referral_announced', '1'); } catch { /* ignore */ }
  };

  const scrollRef = useRef<ScrollView>(null);
  const offsets = useRef<Record<string, number>>({});

  // Refine-shortcut from wizard / cards: arrive with text already in input.
  // Set once on mount so user typing isn't clobbered on re-renders.
  // If `?send=1` is also passed, auto-send it so the dialog starts immediately
  // (chat-first activation) instead of waiting on the user to tap "send".
  const prefillApplied = useRef(false);
  useEffect(() => {
    if (prefillApplied.current) return;
    if (loading) return;  // wait for thread to load so auto-send appends after history
    if (typeof prefillParam === 'string' && prefillParam.length > 0) {
      prefillApplied.current = true;
      if (sendParam === '1') {
        // fire-and-forget — `send` already handles its own loading/error
        void send(prefillParam);
      } else {
        setInput(prefillParam);
      }
    }
  }, [prefillParam, sendParam, loading]);

  const refresh = async () => {
    try {
      const url = pidParam ? `/chat/thread?project_id=${encodeURIComponent(pidParam)}` : '/chat/thread';
      const r = await api.get(url);
      setMessages(r.data?.messages || []);
    } catch { /* anonymous users get 401 — show empty state, not an error overlay */ }
    finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, [pidParam]);

  // Live updates: poll for admin replies every 6s while screen is mounted.
  // Backend persists admin → client messages with type="support"; this surfaces
  // them without the user having to navigate away and back.
  useEffect(() => {
    const tick = async () => {
      try {
        const url = pidParam ? `/chat/thread?project_id=${encodeURIComponent(pidParam)}` : '/chat/thread';
        const r = await api.get(url);
        const next: ChatMsg[] = r.data?.messages || [];
        setMessages((prev) => (prev.length === next.length ? prev : next));
      } catch { /* keep last good state */ }
    };
    const id = setInterval(tick, 6000);
    return () => clearInterval(id);
  }, [pidParam]);

  // Scroll to bottom on first paint, OR to deep-linked message if present.
  useEffect(() => {
    if (loading || messages.length === 0) return;
    setTimeout(() => {
      if (deeplinkId && offsets.current[deeplinkId] != null) {
        scrollRef.current?.scrollTo({ y: Math.max(0, offsets.current[deeplinkId] - 60), animated: true });
      } else {
        scrollRef.current?.scrollToEnd({ animated: true });
      }
    }, 80);
  }, [loading, messages.length, deeplinkId]);

  const send = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || sending) return;
    // Just-in-time auth: anonymous users can browse the chat seed/marketing,
    // but sending a message is gated. AuthGate will replay this exact send
    // after verify, so the user doesn't lose their message.
    requireAuth(async () => {
      setInput('');
      setSending(true);
      try {
        const r = await api.post('/chat/message', { text, project_id: pidParam || null });
        const appended: ChatMsg[] = r.data?.messages || [];
        setMessages((prev) => [...prev, ...appended]);
      } catch (e: any) {
        Alert.alert('Send failed', e?.response?.data?.detail || 'Try again.');
      } finally {
        setSending(false);
      }
    }, 'Save your conversation');
  };

  const runAction = async (m: ChatMsg, a: ChatAction) => {
    try {
      if (a.action === 'approve_deliverable' && a.entity_id) {
        await api.post(`/client/deliverables/${a.entity_id}/approve`);
      } else if (a.action === 'reject_deliverable' && a.entity_id) {
        await api.post(`/client/deliverables/${a.entity_id}/reject`, { reason: 'Requested changes from chat' });
      } else if (a.action === 'pay_invoice' && a.entity_id) {
        await api.post(`/client/invoices/${a.entity_id}/pay`);
      } else if (a.action === 'view_modules' && a.entity_id) {
        // Drop the user into the live workspace for this project.
        router.push(`/client/projects/${a.entity_id}` as any);
        return;
      } else if (a.action === 'add_feature') {
        // Pre-load input so the user can type details without thinking
        // about how to phrase the first message.
        setInput('I want to add: ');
        return;
      } else if (a.action === 'ask_included') {
        // Auto-send the question — chip becomes a one-tap conversation starter.
        await send("What's included in my project?");
        // Clear the chips so the user knows their tap was accepted.
        setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, actions: [] } : x)));
        return;
      } else {
        Alert.alert('Action', `${a.label} sent.`);
        return;
      }
      // Clear that action message — user has acted on it.
      setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, actions: [] } : x)));
      Alert.alert('Done', `${a.label}: success.`);
      refresh();
    } catch (e: any) {
      Alert.alert('Action failed', e?.response?.data?.detail || 'Try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[s.header, { paddingTop: Math.max(insets.top, 8) }]}>
        <TouchableOpacity testID="chat-close" onPress={() => router.back()} style={s.headerBtn}>
          <Ionicons name="close" size={22} color={T.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Chat</Text>
        <View style={s.headerBtn} />
      </View>

      {/* Feed */}
      <ScrollView
        ref={scrollRef}
        style={s.feed}
        contentContainerStyle={s.feedContent}
        keyboardShouldPersistTaps="handled"
        testID="chat-feed"
      >
        {loading ? (
          <View style={s.empty}><ActivityIndicator color={T.primary} /></View>
        ) : messages.length === 0 ? (
          <View style={s.empty}><Text style={{ color: T.textMuted }}>No messages yet.</Text></View>
        ) : messages.map((m) => {
          const isUser = m.type === 'user';
          const st = TYPE_STYLE[m.type] || TYPE_STYLE.system;
          return (
            <View
              key={m.id}
              testID={`chat-msg-${m.id}`}
              onLayout={(e) => { offsets.current[m.id] = e.nativeEvent.layout.y; }}
              style={[s.msgRow, isUser && { justifyContent: 'flex-end' }]}
            >
              <View style={[
                s.msgBubble,
                { backgroundColor: st.bg, borderColor: st.border },
                isUser && { maxWidth: '78%' },
              ]}>
                {!isUser ? (
                  <Text style={[s.msgKind, { color: st.accent }]}>
                    {m.type.toUpperCase()}
                  </Text>
                ) : null}
                <Text style={s.msgText}>{m.text}</Text>
                {(m.actions && m.actions.length > 0) ? (
                  <View style={s.actionRow}>
                    {m.actions.map((a, i) => (
                      <TouchableOpacity
                        key={i}
                        testID={`chat-action-${m.id}-${i}`}
                        style={[
                          s.actionBtn,
                          a.action === 'approve_deliverable' && { backgroundColor: T.primary },
                          a.action === 'pay_invoice' && { backgroundColor: '#F59E0B' },
                        ]}
                        onPress={() => runAction(m, a)}
                      >
                        <Text style={[
                          s.actionText,
                          (a.action === 'approve_deliverable' || a.action === 'pay_invoice') && { color: '#0B0F14' },
                        ]}>
                          {a.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}
              </View>
            </View>
          );
        })}
        {/* Phase 3.D — pending contract one-shot. Surfaces the "Review & Start"
            CTA inside the conversation thread the user is already in. */}
        {(me as any)?.pending_contract ? (
          <View style={s.msgRow} testID="chat-msg-pending-contract">
            <View style={[s.msgBubble, { backgroundColor: '#F59E0B14', borderColor: '#F59E0B66' }]}>
              <Text style={[s.msgKind, { color: '#F59E0B' }]}>READY TO START</Text>
              <Text style={s.msgText}>
                Your project is ready to start. Review the agreement and tap Accept to launch development.
              </Text>
              <View style={s.actionRow}>
                <TouchableOpacity
                  testID="chat-pending-contract-review"
                  style={[s.actionBtn, { backgroundColor: '#F59E0B' }]}
                  onPress={() => router.push(`/client/contract/${(me as any).pending_contract.project_id}` as any)}
                >
                  <Text style={[s.actionText, { color: '#0B0F14' }]}>Review &amp; Start</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : null}

        {/* Phase 2.A — referral one-shot announce. Only when eligible AND not yet seen. */}
        {refAnnounce ? (
          <View style={s.msgRow} testID="chat-msg-referral-announce">
            <View style={[s.msgBubble, { backgroundColor: '#2FE6A614', borderColor: '#2FE6A655' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={[s.msgKind, { color: '#2FE6A6' }]}>EARN</Text>
                <TouchableOpacity
                  testID="chat-referral-dismiss"
                  onPress={dismissReferralAnnounce}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={14} color={T.textMuted} />
                </TouchableOpacity>
              </View>
              <Text style={s.msgText}>
                You can now earn from referrals — get 7% from every project you bring.
              </Text>
              <View style={s.actionRow}>
                <TouchableOpacity
                  testID="chat-referral-get-link"
                  style={[s.actionBtn, { backgroundColor: '#2FE6A6' }]}
                  onPress={() => {
                    void dismissReferralAnnounce();
                    router.push('/client/referrals' as any);
                  }}
                >
                  <Text style={[s.actionText, { color: '#0B0F14' }]}>Get my link</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Quick commands — chip row above input */}
      <View style={s.quickRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {QUICK.map((q) => (
            <TouchableOpacity
              key={q}
              testID={`chat-quick-${q.replace(/\W/g, '_')}`}
              style={s.quickChip}
              onPress={() => send(q)}
              disabled={sending}
            >
              <Text style={s.quickText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Input */}
      <View style={[s.inputRow, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <TextInput
          testID="chat-input"
          style={s.input}
          placeholder="type message..."
          placeholderTextColor={T.textMuted}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => send()}
          returnKeyType="send"
          editable={!sending}
        />
        <TouchableOpacity
          testID="chat-send"
          style={[s.sendBtn, (!input.trim() || sending) && { opacity: 0.45 }]}
          onPress={() => send()}
          disabled={!input.trim() || sending}
        >
          {sending ? <ActivityIndicator color={T.bg} size="small" /> : (
            <Ionicons name="arrow-up" size={20} color={T.bg} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: T.md, paddingBottom: 10,
    backgroundColor: T.surface1,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  headerBtn: { width: 40, alignItems: 'flex-start' },
  headerTitle: { color: T.text, fontSize: T.h3, fontWeight: '800' },

  feed: { flex: 1 },
  feedContent: { padding: T.md, gap: 8 },
  empty: { alignItems: 'center', paddingVertical: 40 },

  msgRow: { flexDirection: 'row', marginBottom: 6 },
  msgBubble: {
    maxWidth: '88%',
    borderRadius: T.radius,
    borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  msgKind: {
    fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginBottom: 4,
  },
  msgText: { color: T.text, fontSize: T.body, lineHeight: 22 },

  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  actionBtn: {
    backgroundColor: T.surface2,
    borderWidth: 1, borderColor: T.border,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 8,
  },
  actionText: { color: T.text, fontSize: T.small, fontWeight: '700' },

  quickRow: {
    paddingHorizontal: T.md, paddingTop: 6, paddingBottom: 6,
    backgroundColor: T.bg,
  },
  quickChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: T.surface1, borderWidth: 1, borderColor: T.border,
    marginRight: 8,
  },
  quickText: { color: T.textMuted, fontSize: T.small, fontWeight: '600' },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: T.md, paddingTop: 8,
    backgroundColor: T.surface1,
    borderTopWidth: 1, borderTopColor: T.border,
  },
  input: {
    flex: 1,
    backgroundColor: T.bg, color: T.text,
    borderWidth: 1, borderColor: T.border, borderRadius: 18,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: T.body,
    maxHeight: 110,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: T.primary,
    alignItems: 'center', justifyContent: 'center',
  },
});

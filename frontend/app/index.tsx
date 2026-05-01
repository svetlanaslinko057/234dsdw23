import { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../src/auth';
import { useMe } from '../src/use-me';
import api from '../src/api';
import { resolveUserEntry } from '../src/resolve-entry';
import {
  hasWelcomeBeenSeenInSession,
  consumeJustLeftWelcome,
} from '../src/welcome-session';
import T from '../src/theme';

/**
 * L0 entry point — Visitor Landing.
 *
 * Clean welcome flow (no $0 noise, no auth competing, gibberish protection):
 *   1. Wordmark EVA-X + one-line promise
 *   2. Describe product (strict validation: 40+ chars, 5+ words, not gibberish)
 *   3. Pick production mode (value, not price)
 *   4. Primary CTA: "Estimate my product"
 *   5. Tiny "Log in" link
 *   6. Separate developer entry below the fold
 *
 * Auth NEVER comes first — user must feel value before commitment.
 */

type Mode = 'ai' | 'hybrid' | 'dev';

/**
 * MODES represent three PRODUCTION METHODS of the same product scope.
 * All three deliver the full product — they differ in speed, cost, and risk.
 * This framing matters: users should NOT feel they're buying less functionality
 * with a cheaper tier, they're buying a different delivery method.
 */
const MODES: {
  id: Mode;
  label: string;
  headline: string;     // The promise — one bold line
  bullets: string[];    // 3-4 concrete differentiators
  color: string;
  icon: any;
  popular?: boolean;
}[] = [
  {
    id: 'ai',
    label: 'AI Build',
    headline: 'Fastest, lowest cost',
    bullets: [
      'Full product scope',
      'Built entirely with AI-generated code',
      'Delivered quickly',
      'May require post-launch fixes',
    ],
    color: '#7C5CFF',
    icon: 'flash',
  },
  {
    id: 'hybrid',
    label: 'AI + Engineering',
    headline: 'Balanced speed & quality',
    bullets: [
      'AI foundation + human review',
      'Production-ready',
      'Optimized architecture',
      'Stable launch',
    ],
    color: '#2FE6A6',
    icon: 'git-network',
    popular: true,
  },
  {
    id: 'dev',
    label: 'Full Engineering',
    headline: 'Maximum quality & control',
    bullets: [
      'Built by senior developers',
      'Custom architecture',
      'Full QA & validation',
      'Highest reliability',
    ],
    color: '#F59E0B',
    icon: 'ribbon',
  },
];

const MIN_GOAL = 40;
const MAX_GOAL = 3000;
const MAX_FILE_BYTES = 400_000;

/**
 * Gibberish / nonsense detector — runs on the client so we never waste a
 * backend round-trip on obvious noise. Trigger: too short, not enough words,
 * long run of identical chars, or almost no letters.
 */
function isGibberish(text: string): boolean {
  const clean = text.trim();
  if (clean.length < MIN_GOAL) return true;
  const letters = clean.replace(/[^a-zA-Zа-яА-ЯёЁ]/g, '');
  if (letters.length < 20) return true;
  const words = clean.split(/\s+/).filter(w => w.length > 1);
  if (words.length < 5) return true;
  if (/(.)\1{5,}/.test(clean)) return true;       // "aaaaaa"
  if (/^([^\s])\1+$/.test(clean.replace(/\s/g, ''))) return true; // single-char spam
  return false;
}

export default function Index() {
  const router = useRouter();
  const { token, loading: authLoading } = useAuth();
  const { me, loading: meLoading } = useMe();
  // True for one render after the user clicked "See my product plan" on
  // /welcome. Drives the visual continuity strip ("STEP 1 OF 3 — Let's
  // build your product"). Read once on mount via consumeJustLeftWelcome()
  // (which clears the flag after read), so the strip never re-renders.
  const [cameFromWelcome, setCameFromWelcome] = useState(false);

  useEffect(() => {
    if (consumeJustLeftWelcome()) {
      setCameFromWelcome(true);
    }
  }, []);

  useEffect(() => {
    if (authLoading || meLoading) return;
    if (token && me) {
      router.replace(resolveUserEntry(me) as any);
      return;
    }
    // Production rule: route every guest through /welcome ONCE per browser
    // tab / app launch (sessionStorage on web, in-memory on native).
    // Returning visitors landing on / inside the same session are NOT
    // bounced — they go straight to describe. This prevents the
    // "every-reload-shows-onboarding" anti-pattern that kills retention.
    if (!token && !hasWelcomeBeenSeenInSession()) {
      router.replace('/welcome' as any);
    }
  }, [authLoading, meLoading, token, me, router]);

  const [goal, setGoal] = useState('');
  const [mode, setMode] = useState<Mode>('hybrid');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>('');
  const [attachment, setAttachment] = useState<{ name: string; text: string } | null>(null);
  const fileInputRef = useRef<any>(null);

  const goalLen = goal.trim().length;
  const isTooShort = goalLen < MIN_GOAL;
  const charHint =
    goalLen === 0
      ? `min ${MIN_GOAL} chars · max ${MAX_GOAL}`
      : isTooShort
        ? `${MIN_GOAL - goalLen} more to go · ${goalLen}/${MAX_GOAL}`
        : `${goalLen}/${MAX_GOAL}`;

  const [parsing, setParsing] = useState(false);

  /** Lift a raw file (web File or native asset uri) into text via the backend
   *  parser. Works the same for both platforms — server-side extraction keeps
   *  the client slim and always up-to-date with supported formats
   *  (PDF / DOCX / XLSX / PPTX / images / txt / md). */
  const uploadAndParse = async (
    native: { uri: string; name: string; mime?: string } | null,
    webFile: File | null,
  ) => {
    setError('');
    setParsing(true);
    try {
      const form = new FormData();
      if (webFile) {
        form.append('file', webFile);
      } else if (native) {
        // RN FormData requires this shape — typed as any because the DOM
        // typings don't know about uri objects.
        form.append('file', {
          uri:  native.uri,
          name: native.name,
          type: native.mime || 'application/octet-stream',
        } as any);
      } else {
        return;
      }
      const res = await api.post('/estimate/parse-file', form, {
        // Let fetch/axios pick the multipart boundary automatically.
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 45000,
      });
      const { name, text, truncated, source } = res.data as {
        name: string; text: string; truncated: boolean; source: string;
      };
      setAttachment({ name, text: (text || '').slice(0, 8000) });
      if (truncated) {
        // Informational, not an error — we still attached the brief.
        setError(`Attached ${name} · ${source} · trimmed to 8000 chars`);
      }
    } catch (e: any) {
      const status = e?.response?.status;
      const msg    = e?.response?.data?.detail || e?.message || 'Could not read file';
      setError(status === 413 ? msg : `Couldn't attach: ${msg}`);
    } finally {
      setParsing(false);
    }
  };

  const onPickFile = async () => {
    setError('');
    // Web: tap the hidden <input type=file>.
    if (Platform.OS === 'web') {
      fileInputRef.current?.click?.();
      return;
    }
    // Native (iOS / Android): DocumentPicker handles the system sheet, copies
    // the file to a cache uri we can upload via FormData.
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (res.canceled) return;
      const asset = res.assets?.[0];
      if (!asset) return;
      await uploadAndParse(
        { uri: asset.uri, name: asset.name || 'brief', mime: asset.mimeType || undefined },
        null,
      );
    } catch (e: any) {
      setError(`Could not open file picker: ${String(e?.message || e)}`);
    }
  };

  const onFileChosen = async (ev: any) => {
    const file = ev?.target?.files?.[0];
    if (!file) return;
    try {
      await uploadAndParse(null, file);
    } finally {
      ev.target.value = '';
    }
  };

  const estimateProduct = async () => {
    setError('');
    const g = goal.trim();
    // Hard validation — don't even call backend on garbage.
    if (g.length < MIN_GOAL) {
      setError(
        `Describe the product in more detail: what it does, who uses it, and what result you expect. ${MIN_GOAL - g.length} more characters to go.`
      );
      return;
    }
    if (isGibberish(g)) {
      setError(
        "This doesn't look like a product description. Try describing the app, users, and main features (3-4 sentences)."
      );
      return;
    }
    try {
      setBusy(true);
      console.log('CALLING ESTIMATE', { goal_len: g.length, mode, file: !!attachment });
      const r = await api.post('/estimate', {
        goal: g,
        mode,
        file_text: attachment?.text || undefined,
      });
      if (r.data?.clarity === 'invalid') {
        setError(r.data.message || "This doesn't look like a product description. Try again with a few sentences.");
        return;
      }
      if (r.data?.clarity === 'low') {
        router.push({
          pathname: '/estimate-improve',
          params: {
            goal: g,
            mode,
            message: r.data.message || '',
            suggestions: JSON.stringify(r.data.suggestions || []),
          },
        } as any);
        return;
      }
      router.push({
        pathname: '/estimate-result',
        params: { data: JSON.stringify(r.data), goal: g, mode },
      } as any);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || 'Could not calculate. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const goLogin = () => router.push('/auth' as any);

  if (authLoading || (token && meLoading)) {
    return <View style={s.loading}><ActivityIndicator size="large" color={T.primary} /></View>;
  }

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={s.container}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        testID="visitor-home"
      >
        {/* Wordmark moved to AppHeader — no duplicate logo in the body. */}
        {cameFromWelcome && (
          <View style={s.continuityStrip} testID="continuity-strip">
            <Text style={s.continuityEyebrow}>STEP 1 OF 3</Text>
            <Text style={s.continuityTitle}>Let&apos;s build your product</Text>
            <Text style={s.continuitySub}>Describe your idea below ↓</Text>
          </View>
        )}
        {!cameFromWelcome && (
          <Text style={s.heroTitle}>Build products.{'\n'}Not tickets.</Text>
        )}
        <Text style={s.heroSub}>
          {cameFromWelcome
            ? 'A few sentences is enough. We turn it into a full product plan with modules, timeline, and price.'
            : 'Describe what you want. See the real plan in 30 seconds — no sign-up required.'}
        </Text>

        <View style={s.eyebrowRow}>
          <Text style={s.eyebrow}>DESCRIBE YOUR PRODUCT</Text>
          <Text style={[s.charHint, isTooShort && goalLen > 0 && { color: T.risk }]}>{charHint}</Text>
        </View>
        <TextInput
          testID="visitor-goal-input"
          style={[s.input, error && isTooShort ? s.inputError : null]}
          placeholder={'Example: "A marketplace for freelance chefs with booking, reviews, Stripe payouts, and push reminders for Russian and English users."'}
          placeholderTextColor={T.textMuted}
          value={goal}
          onChangeText={(v) => {
            const trimmed = v.length > MAX_GOAL ? v.slice(0, MAX_GOAL) : v;
            setGoal(trimmed);
            if (error) setError('');
          }}
          maxLength={MAX_GOAL}
          multiline
          textAlignVertical="top"
        />

        {/* Attachment row */}
        <View style={s.attachRow}>
          <TouchableOpacity
            testID="visitor-attach-btn"
            style={s.attachBtn}
            onPress={onPickFile}
            disabled={parsing}
          >
            {parsing
              ? <ActivityIndicator size="small" color={T.textMuted} />
              : <Ionicons name="attach" size={16} color={T.textMuted} />}
            <Text style={s.attachText}>
              {parsing
                ? 'Reading file…'
                : attachment
                  ? `Attached: ${attachment.name}`
                  : 'Attach brief (PDF, DOCX, XLSX, PPTX, image, TXT)'}
            </Text>
          </TouchableOpacity>
          {attachment && !parsing && (
            <TouchableOpacity testID="visitor-attach-clear" onPress={() => setAttachment(null)}>
              <Ionicons name="close-circle" size={18} color={T.textMuted} />
            </TouchableOpacity>
          )}
          {Platform.OS === 'web' && (
            // @ts-ignore — only exists on web
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.markdown,.pdf,.docx,.xlsx,.pptx,.png,.jpg,.jpeg,.webp,.heic,.heif,.bmp,.gif,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.presentationml.presentation,image/*"
              style={{ display: 'none' }}
              onChange={onFileChosen}
            />
          )}
        </View>

        {/* Micro-signal: as soon as user starts typing we hint that the
            system is "already thinking". Pure client-side, no API call.
            - while short: "Analyzing your idea…"
            - when long enough: "Ready to plan" — tells user CTA is unlocked */}
        {!error && goalLen > 0 && (
          <View style={s.analyzingRow} testID="visitor-analyzing">
            <View style={[s.pulseDot, !isTooShort && { backgroundColor: '#2FE6A6' }]} />
            <Text style={[s.analyzingText, !isTooShort && { color: '#2FE6A6' }]}>
              {isTooShort ? 'Analyzing your idea…' : 'Ready to plan'}
            </Text>
          </View>
        )}

        {error ? (
          <View style={s.errorBox} testID="visitor-error">
            <Ionicons name="alert-circle" size={16} color={T.danger} />
            <Text style={s.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Value cards — different PRODUCTION METHODS for the SAME product.
            This framing matters: users don't buy "more/less", they pick how it's built. */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Choose how we build your product</Text>
          <Text style={s.sectionSub}>
            All options deliver the full product. The difference is speed, cost, and reliability.
          </Text>
        </View>
        {MODES.map((m) => {
          const active = mode === m.id;
          return (
            <TouchableOpacity
              key={m.id}
              testID={`visitor-mode-${m.id}`}
              style={[s.modeCard, active && { borderColor: m.color, backgroundColor: m.color + '14' }]}
              onPress={() => setMode(m.id)}
              activeOpacity={0.85}
            >
              {m.popular && (
                <View style={[s.popularBadge, { backgroundColor: m.color }]}>
                  <Ionicons name="star" size={9} color={T.bg} />
                  <Text style={[s.popularBadgeText, { color: T.bg }]}>RECOMMENDED</Text>
                </View>
              )}
              <View style={s.modeHeader}>
                <View style={[s.modeDot, { backgroundColor: m.color + '22' }]}>
                  <Ionicons name={m.icon} size={16} color={m.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.modeLabel}>{m.label}</Text>
                  <Text style={[s.modeHeadline, { color: m.color }]}>{m.headline}</Text>
                </View>
                <Ionicons
                  name={active ? 'checkmark-circle' : 'ellipse-outline'}
                  size={22}
                  color={active ? m.color : T.textMuted}
                />
              </View>
              <View style={s.modeBullets}>
                {m.bullets.map((b, i) => (
                  <View key={i} style={s.modeBulletRow}>
                    <View style={[s.modeBulletDot, { backgroundColor: m.color }]} />
                    <Text style={s.modeBulletText}>{b}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Footer — reinforce the "same product" promise right below the cards */}
        <Text style={s.sameProductNote}>
          Same product scope across all three options. You're choosing the build method, not the feature set.
        </Text>

        {/* Primary CTA */}
        <TouchableOpacity
          testID="visitor-start-cta"
          style={[s.primary, (busy || isTooShort) ? { opacity: 0.55 } : null]}
          onPress={estimateProduct}
          disabled={busy || isTooShort}
          activeOpacity={0.9}
        >
          {busy ? (
            <>
              <ActivityIndicator color={T.bg} />
              <Text style={[s.primaryText, { marginLeft: 10 }]}>Planning your product…</Text>
            </>
          ) : (
            <>
              <Text style={s.primaryText}>See my product plan</Text>
              <Ionicons name="arrow-forward" size={18} color={T.bg} />
            </>
          )}
        </TouchableOpacity>
        <Text style={s.ctaHint}>
          Real plan &amp; price · No sign-up · Takes 30 seconds
        </Text>

        {/* Tiny login link — secondary */}
        <TouchableOpacity testID="visitor-login-link" onPress={goLogin} style={s.loginLink}>
          <Text style={s.loginText}>
            Already have an account?{' '}
            <Text style={{ color: T.primary, fontWeight: '700' }}>Log in</Text>
          </Text>
        </TouchableOpacity>

        {/* Developer entry — separate secondary track */}
        <View style={s.devDivider} />
        <View style={s.devCard} testID="visitor-dev-card">
          <View style={s.devCardHeader}>
            <Ionicons name="code-slash-outline" size={18} color={T.primary} />
            <Text style={s.devCardEyebrow}>FOR DEVELOPERS</Text>
          </View>
          <Text style={s.devCardTitle}>Join the team building real client products</Text>
          <Text style={s.devCardSub}>
            Open tasks, performance tracking, payouts, and growth — all in one workspace.
          </Text>
          <TouchableOpacity
            testID="visitor-developer-cta"
            style={s.devCta}
            onPress={() => router.push('/auth?intent=developer' as any)}
            activeOpacity={0.9}
          >
            <Text style={s.devCtaText}>Join as developer</Text>
            <Ionicons name="arrow-forward" size={16} color={T.primary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: T.bg },
  container: { flex: 1, backgroundColor: T.bg },
  content: { padding: T.lg, paddingBottom: T.xl * 2 },
  loading: { flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' },

  wordmark: {
    color: T.primary,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: T.md,
    marginTop: T.sm,
  },
  heroTitle: { color: T.text, fontSize: 34, fontWeight: '800', lineHeight: 40, marginTop: T.xs },
  heroSub: { color: T.textMuted, fontSize: T.body, marginTop: T.md, lineHeight: 22 },
  continuityStrip: {
    backgroundColor: T.surface1,
    borderLeftWidth: 3,
    borderLeftColor: T.primary,
    borderRadius: T.radius,
    paddingVertical: T.md,
    paddingHorizontal: T.md,
    marginTop: T.xs,
    marginBottom: T.xs,
  },
  continuityEyebrow: {
    color: T.primary,
    fontSize: T.tiny,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 6,
  },
  continuityTitle: {
    color: T.text,
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
  },
  continuitySub: {
    color: T.textSecondary,
    fontSize: T.small,
    marginTop: 4,
  },

  eyebrowRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: T.xl, marginBottom: T.sm },
  eyebrow: { color: T.primary, fontSize: T.tiny, letterSpacing: 2, fontWeight: '800' },
  charHint: { color: T.textMuted, fontSize: T.tiny, fontWeight: '600' },

  input: {
    backgroundColor: T.surface1, borderRadius: T.radius, borderWidth: 1, borderColor: T.border,
    color: T.text, fontSize: T.body, padding: T.md, minHeight: 120,
  },
  inputError: { borderColor: T.danger },

  attachRow: {
    marginTop: T.sm,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  attachBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 6, paddingHorizontal: 10,
    borderRadius: 8, borderWidth: 1, borderColor: T.border,
    backgroundColor: T.surface1,
  },
  attachText: { color: T.textMuted, fontSize: T.small, fontWeight: '600' },

  errorBox: {
    marginTop: T.sm,
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    padding: T.sm,
    borderRadius: 10,
    backgroundColor: T.danger + '15',
    borderWidth: 1, borderColor: T.danger + '55',
  },
  errorText: { color: T.danger, fontSize: T.small, flex: 1, lineHeight: 18 },

  modeCard: {
    backgroundColor: T.surface1, borderRadius: T.radius, padding: T.md,
    borderWidth: 1, borderColor: T.border, marginTop: T.sm,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -10, right: T.md,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 999,
    // Sit cleanly above the card border — solid bg, subtle outer ring of the
    // page background, plus a soft glow for depth.
    borderWidth: 2, borderColor: T.bg,
    shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    zIndex: 2,
  },
  popularBadgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  modeHeader: { flexDirection: 'row', alignItems: 'center', gap: T.md },
  modeDot: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  modeLabel: { color: T.text, fontSize: T.body, fontWeight: '700' },
  modeHeadline: { fontSize: T.small, fontWeight: '700', marginTop: 2 },
  modeBullets: { marginTop: T.sm, paddingLeft: 48, gap: 4 },
  modeBulletRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modeBulletDot: { width: 4, height: 4, borderRadius: 2 },
  modeBulletText: { color: T.textMuted, fontSize: T.small, fontWeight: '500' },

  analyzingRow: {
    marginTop: T.sm,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  pulseDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: T.primary,
    opacity: 0.85,
  },
  analyzingText: {
    color: T.textMuted, fontSize: T.small, fontWeight: '600',
    letterSpacing: 0.3,
  },

  sectionHeader: { marginTop: T.xl, marginBottom: T.md },
  sectionTitle: { color: T.text, fontSize: T.h2, fontWeight: '800', lineHeight: 28 },
  sectionSub: { color: T.textMuted, fontSize: T.small, marginTop: 6, lineHeight: 18 },
  sameProductNote: {
    color: T.textMuted,
    fontSize: T.tiny,
    marginTop: T.md,
    textAlign: 'center',
    lineHeight: 16,
    opacity: 0.75,
    fontStyle: 'italic',
  },

  primary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: T.sm,
    backgroundColor: T.primary, borderRadius: T.radius, paddingVertical: 16,
    marginTop: T.xl,
  },
  primaryText: { color: T.bg, fontSize: T.h3, fontWeight: '800' },
  ctaHint: { color: T.textMuted, fontSize: T.tiny, textAlign: 'center', marginTop: T.sm, opacity: 0.85 },

  loginLink: { marginTop: T.lg, alignItems: 'center', paddingVertical: T.sm },
  loginText: { color: T.textMuted, fontSize: T.small },

  devDivider: {
    height: 1,
    backgroundColor: T.border,
    marginVertical: T.xl,
    opacity: 0.6,
  },
  devCard: {
    backgroundColor: T.surface1,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: T.radius,
    padding: T.lg,
  },
  devCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: T.sm },
  devCardEyebrow: {
    color: T.primary, fontSize: T.tiny, letterSpacing: 2, fontWeight: '800',
  },
  devCardTitle: { color: T.text, fontSize: T.h3, fontWeight: '700', lineHeight: 24 },
  devCardSub: { color: T.textMuted, fontSize: T.small, marginTop: 6, lineHeight: 18 },
  devCta: {
    marginTop: T.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 12,
    borderRadius: T.radius,
    borderWidth: 1,
    borderColor: T.primary + '88',
    backgroundColor: T.primary + '14',
  },
  devCtaText: { color: T.primary, fontSize: T.body, fontWeight: '800' },
});

import { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/auth';
import { useMe } from '../src/use-me';
import { resolveUserEntry } from '../src/resolve-entry';
import {
  markWelcomeSeenForSession,
  markJustLeftWelcome,
} from '../src/welcome-session';
import T from '../src/theme';

/**
 * Welcome layer — shown ONCE per browser tab / app launch.
 *
 * Flow:
 *   Cold launch (guest)  →  /welcome  →  [See my product plan]  →  /
 *   In-session reload    →  /  (sessionStorage flag set)
 *   Authed user          →  resolved home (skip welcome entirely)
 *
 * Job of this screen:
 *   1. Make user understand what EVA-X is in 5 seconds
 *   2. Build trust ("real product, fixed price, no chaos")
 *   3. One single CTA → describe-your-product flow
 *
 * Hard rules:
 *   - No form fields here
 *   - No price logic here
 *   - No mode selection here
 *   - All of that lives on `/` (describe)
 */
export default function WelcomeScreen() {
  const router = useRouter();
  const { token, loading: authLoading } = useAuth();
  const { me, loading: meLoading } = useMe();

  // If user is already signed in, skip the welcome screen entirely and
  // route them straight to their resolved entry (admin / dev / client home).
  useEffect(() => {
    if (authLoading || meLoading) return;
    if (token && me) {
      router.replace(resolveUserEntry(me) as any);
    }
  }, [authLoading, meLoading, token, me, router]);

  const onStart = () => {
    // Mark welcome as seen for this session (sessionStorage on web,
    // in-memory on native). Also flag "just left welcome" so the
    // describe screen can render its continuity strip on first paint.
    markWelcomeSeenForSession();
    markJustLeftWelcome();
    router.replace('/' as any);
  };

  const onLogin = () => {
    markWelcomeSeenForSession();
    router.push('/auth' as any);
  };

  if (authLoading || (token && meLoading)) {
    return (
      <View style={s.loading} testID="welcome-loading">
        <ActivityIndicator size="large" color={T.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      testID="welcome-screen"
    >
      {/* Hero */}
      <View style={s.hero}>
        <Text style={s.title} testID="welcome-title">
          Build real products.{'\n'}Not tasks.
        </Text>
        <Text style={s.subtitle} testID="welcome-subtitle">
          Describe your idea. Get a full product plan. Launch with our team.
        </Text>
        <Text style={s.microPromise} testID="welcome-micro-promise">
          No freelancers. No chaos. One system that builds your product.
        </Text>
      </View>

      {/* Steps — 3 lines, no fluff */}
      <View style={s.section}>
        <Step number="1" text="Describe your idea" />
        <Step number="2" text="Get full plan & price" />
        <Step number="3" text="We build your product" />
      </View>

      {/* Benefits */}
      <View style={s.section}>
        <Benefit text="Real product, not prototype" />
        <Benefit text="Fixed scope & pricing" />
        <Benefit text="Built by platform team" />
        <Benefit text="No hiring, no chaos" />
      </View>

      {/* Trust strip */}
      <View style={s.trustBox} testID="welcome-trust">
        <Text style={s.trustEyebrow}>USED TO BUILD</Text>
        <Text style={s.trustLine}>SaaS platforms · Marketplaces · AI tools · Internal systems</Text>
      </View>

      {/* Primary CTA */}
      <TouchableOpacity
        style={s.cta}
        onPress={onStart}
        activeOpacity={0.9}
        testID="welcome-start-cta"
      >
        <Text style={s.ctaText}>See my product plan</Text>
        <Ionicons name="arrow-forward" size={18} color={T.bg} />
      </TouchableOpacity>

      <Text style={s.ctaHint}>30 seconds · No sign-up required</Text>

      {/* Secondary login link */}
      <TouchableOpacity
        onPress={onLogin}
        style={s.loginLink}
        testID="welcome-login-link"
      >
        <Text style={s.loginText}>
          Already have an account?{' '}
          <Text style={{ color: T.primary, fontWeight: '700' }}>Log in</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ---------- Local primitives ---------- */

function Step({ number, text }: { number: string; text: string }) {
  return (
    <View style={s.step} testID={`welcome-step-${number}`}>
      <View style={s.stepBadge}>
        <Text style={s.stepNumber}>{number}</Text>
      </View>
      <Text style={s.stepText}>{text}</Text>
    </View>
  );
}

function Benefit({ text }: { text: string }) {
  return (
    <View style={s.benefitRow}>
      <Ionicons name="checkmark-circle" size={16} color={T.primary} />
      <Text style={s.benefitText}>{text}</Text>
    </View>
  );
}

/* ---------- Styles ---------- */

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  content: { padding: T.lg, paddingBottom: T.xxl },
  loading: {
    flex: 1,
    backgroundColor: T.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logo: {
    color: T.primary,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: T.xl,
    marginTop: T.xs,
  },

  hero: { marginBottom: T.xl },
  title: {
    color: T.text,
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 40,
    marginBottom: T.md,
  },
  subtitle: {
    color: T.textSecondary,
    fontSize: T.body,
    lineHeight: 22,
  },
  microPromise: {
    color: T.primary,
    fontSize: T.body,
    fontWeight: '700',
    lineHeight: 22,
    marginTop: T.md,
  },

  section: { marginBottom: T.xl },

  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: T.sm,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: T.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: T.md,
  },
  stepNumber: { color: T.primary, fontSize: 12, fontWeight: '800' },
  stepText: { color: T.text, fontSize: T.body },

  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: T.xs + 2,
  },
  benefitText: { color: T.textSecondary, fontSize: T.body },

  trustBox: {
    backgroundColor: T.surface1,
    borderRadius: T.radius,
    borderWidth: 1,
    borderColor: T.border,
    padding: T.md,
    marginBottom: T.xl,
  },
  trustEyebrow: {
    color: T.primary,
    fontSize: T.tiny,
    letterSpacing: 2,
    fontWeight: '800',
    marginBottom: 6,
  },
  trustLine: { color: T.textSecondary, fontSize: T.small, lineHeight: 18 },

  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: T.sm,
    backgroundColor: T.primary,
    borderRadius: T.radius,
    paddingVertical: 16,
    marginTop: T.sm,
  },
  ctaText: { color: T.bg, fontSize: T.h3, fontWeight: '800' },
  ctaHint: {
    color: T.textMuted,
    fontSize: T.tiny,
    textAlign: 'center',
    marginTop: T.sm,
    opacity: 0.85,
  },

  loginLink: {
    marginTop: T.lg,
    alignItems: 'center',
    paddingVertical: T.sm,
  },
  loginText: { color: T.textMuted, fontSize: T.small },
});

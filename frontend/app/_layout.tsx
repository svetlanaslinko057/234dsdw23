import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../src/auth';
import { AuthGateProvider } from '../src/auth-gate';
import { FeedbackProvider } from '../src/feedback';
import { StateShiftProvider } from '../src/state-shift';
import AppHeader from '../src/app-header';
import BottomTabs from '../src/bottom-tabs';
import { captureFromUrl, bindIfNeeded } from '../src/referral';
import T from '../src/theme';

/**
 * L0 App Shell — every screen renders inside this frame.
 *
 * Structure (top → bottom):
 *   [AppHeader]        — always (brand + title + identity). Works for guests.
 *   [<Slot />]         — the current route content.
 *   [BottomTabs]       — authed only, visible on L0 + workspace routes.
 *
 * GlobalControlBar is intentionally unmounted: its source endpoint
 * (/api/global/status) is 404, so it rendered null and only spammed the
 * network tab. Re-mount once the endpoint exists.
 *
 * Phase 2.D referral hooks live here so they fire exactly once per app
 * boot (capture from URL) and once per auth state transition (bind).
 */
function AppContent() {
  const { user, loading } = useAuth();
  const authed = !!user && !loading;

  // Capture `?ref=XXX` exactly once on app boot.
  useEffect(() => { void captureFromUrl(); }, []);

  // Whenever we know we have a signed-in user, attempt the bind. The
  // helper is idempotent (24h TTL + bound flag), so re-runs are safe.
  useEffect(() => {
    if (authed) void bindIfNeeded();
  }, [authed]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <AppHeader />
      <View style={styles.body}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: T.bg }, animation: 'fade' }} />
      </View>
      {authed && <BottomTabs />}
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AuthGateProvider>
          <FeedbackProvider>
            <StateShiftProvider>
              <AppContent />
            </StateShiftProvider>
          </FeedbackProvider>
        </AuthGateProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  body: { flex: 1 },
});

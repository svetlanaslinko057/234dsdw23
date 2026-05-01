/**
 * Admin tabs — pult, not cabinet.
 *
 * 4 surfaces only: Home · QA · Finance · Profile
 *
 *   Home    — system status + alerts + quick actions
 *   QA      — pending modules with one-tap decisions
 *   Finance — withdrawals + payout batches with one-tap approve
 *   Profile — admin info + system snapshot + logout
 *
 * Mobile НЕ повторяет web. Mobile реагирует на систему.
 */
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import T from '../../src/theme';

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: T.surface1 },
        headerTintColor: T.text,
        headerTitleStyle: { fontWeight: '700' },
        tabBarStyle: { backgroundColor: T.surface1, borderTopColor: T.border, height: 60, paddingBottom: 8 },
        tabBarActiveTintColor: T.primary,
        tabBarInactiveTintColor: T.textMuted,
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen name="home"    options={{ title: 'Home',    tabBarIcon: ({ color, size }) => <Ionicons name="pulse"            size={size} color={color} /> }} />
      <Tabs.Screen name="qa"      options={{ title: 'QA',      tabBarIcon: ({ color, size }) => <Ionicons name="checkmark-circle" size={size} color={color} /> }} />
      <Tabs.Screen name="finance" options={{ title: 'Finance', tabBarIcon: ({ color, size }) => <Ionicons name="cash"             size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person-circle"    size={size} color={color} /> }} />

      {/* Hidden — legacy routes kept temporarily so deep-links don't 404.
          They redirect to /admin/home via internal nav. */}
      <Tabs.Screen name="control" options={{ href: null }} />
    </Tabs>
  );
}

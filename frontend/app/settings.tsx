import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { T } from '../src/theme';
import { useMe } from '../src/use-me';

const STORAGE_KEYS = {
  theme: 'atlas_theme',     // 'dark' | 'light' (UI hint only — app currently rendered dark-first)
  language: 'atlas_lang',   // 'en' | 'ru' | 'uk'
};

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'uk', label: 'Українська' },
];

export default function Settings() {
  const router = useRouter();
  const { me } = useMe();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [lang, setLang] = useState<string>('en');
  const [twoFA, setTwoFA] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const t = await AsyncStorage.getItem(STORAGE_KEYS.theme);
      const l = await AsyncStorage.getItem(STORAGE_KEYS.language);
      if (t === 'light' || t === 'dark') setTheme(t);
      if (l) setLang(l);
    })();
  }, []);

  const updateTheme = async (next: 'dark' | 'light') => {
    setTheme(next);
    await AsyncStorage.setItem(STORAGE_KEYS.theme, next);
    if (next === 'light') {
      Alert.alert('Light theme', 'Your preference is saved. Light theme rendering will arrive in the next release.');
    }
  };

  const updateLang = async (code: string) => {
    setLang(code);
    await AsyncStorage.setItem(STORAGE_KEYS.language, code);
    if (code !== 'en') {
      Alert.alert('Language', 'Your preference is saved. Translations roll out in the next release.');
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Settings', headerStyle: { backgroundColor: T.bg }, headerTitleStyle: { color: T.text } }} />
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        {/* Identity */}
        <Text style={s.section}>Identity</Text>
        <View style={s.card}>
          <View style={s.identityRow}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{(me?.name || me?.email || 'U').charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{me?.name || 'You'}</Text>
              {!!me?.email && <Text style={s.email}>{me.email}</Text>}
            </View>
          </View>
          <TouchableOpacity
            testID="settings-edit-profile"
            style={s.linkBtn}
            onPress={() => Alert.alert('Edit profile', 'Editing your name & avatar will arrive with the next backend release. For now your initials are derived from your email.')}
          >
            <Ionicons name="create-outline" size={16} color={T.primary} />
            <Text style={s.linkBtnText}>Edit name & avatar</Text>
          </TouchableOpacity>
        </View>

        {/* Security */}
        <Text style={s.section}>Security</Text>
        <View style={s.card}>
          <Row icon="key-outline" label="Sign-in method" value={me?.email ? 'Email · OTP code' : '—'} />
          <Row
            icon="shield-checkmark-outline"
            label="Two-factor auth"
            right={
              <Switch
                testID="settings-2fa"
                value={twoFA}
                onValueChange={(v) => {
                  if (v) {
                    Alert.alert(
                      'Two-factor auth',
                      'TOTP-based 2FA arrives next sprint. Email OTP already protects every login.',
                      [{ text: 'OK', onPress: () => setTwoFA(false) }],
                    );
                  } else {
                    setTwoFA(false);
                  }
                }}
                trackColor={{ false: T.surface2, true: T.primary }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <TouchableOpacity
            testID="settings-change-email"
            style={s.linkBtn}
            onPress={() => Alert.alert('Change email', 'Email change requires verification of both old and new addresses. Coming with the next backend release.')}
          >
            <Ionicons name="mail-outline" size={16} color={T.primary} />
            <Text style={s.linkBtnText}>Change email</Text>
          </TouchableOpacity>
        </View>

        {/* Appearance */}
        <Text style={s.section}>Appearance</Text>
        <View style={s.card}>
          <Text style={s.subLabel}>Theme</Text>
          <View style={s.choices}>
            {(['dark', 'light'] as const).map((m) => (
              <TouchableOpacity
                key={m}
                testID={`settings-theme-${m}`}
                style={[s.choice, theme === m && s.choiceActive]}
                onPress={() => updateTheme(m)}
              >
                <Ionicons
                  name={m === 'dark' ? 'moon' : 'sunny'}
                  size={16}
                  color={theme === m ? T.primary : T.textMuted}
                />
                <Text style={[s.choiceText, theme === m && s.choiceTextActive]}>
                  {m === 'dark' ? 'Dark' : 'Light'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={s.divider} />

          <Text style={s.subLabel}>Language</Text>
          <View style={s.choices}>
            {LANGS.map((l) => (
              <TouchableOpacity
                key={l.code}
                testID={`settings-lang-${l.code}`}
                style={[s.choice, lang === l.code && s.choiceActive]}
                onPress={() => updateLang(l.code)}
              >
                <Text style={[s.choiceText, lang === l.code && s.choiceTextActive]}>
                  {l.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Account */}
        <Text style={s.section}>Account</Text>
        <View style={s.card}>
          <TouchableOpacity
            testID="settings-export-data"
            style={s.linkBtn}
            onPress={() => Alert.alert('Export data', 'Your data (projects, work, earnings) will be emailed to you within 24h. Email feature ships once the email provider is wired in.')}
          >
            <Ionicons name="download-outline" size={16} color={T.text} />
            <Text style={[s.linkBtnText, { color: T.text }]}>Export my data</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="settings-delete-account"
            style={s.linkBtn}
            onPress={() => Alert.alert('Delete account', 'Account deletion requires support to confirm pending payouts and active contracts. Reach out to support@atlas.dev.')}
          >
            <Ionicons name="trash-outline" size={16} color={T.danger} />
            <Text style={[s.linkBtnText, { color: T.danger }]}>Delete account</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: T.xl }} />
        <Text style={s.versionText}>ATLAS DevOS · v1.0</Text>
      </ScrollView>
    </>
  );
}

function Row({ icon, label, value, right }: { icon: any; label: string; value?: string; right?: React.ReactNode }) {
  return (
    <View style={s.row}>
      <Ionicons name={icon} size={18} color={T.textMuted} />
      <View style={{ flex: 1 }}>
        <Text style={s.rowLabel}>{label}</Text>
        {!!value && <Text style={s.rowValue}>{value}</Text>}
      </View>
      {right}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  content: { padding: T.lg, paddingBottom: T.xl * 2 },
  section: {
    color: T.textMuted, fontSize: 12, fontWeight: '700',
    letterSpacing: 1.2, textTransform: 'uppercase',
    marginTop: T.md, marginBottom: T.sm, paddingHorizontal: 4,
  },
  card: {
    backgroundColor: T.surface,
    borderRadius: T.radius,
    borderWidth: 1, borderColor: T.border,
    padding: T.md,
    marginBottom: T.sm,
  },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: T.md, marginBottom: T.md },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(47,230,166,0.15)',
    borderWidth: 1, borderColor: 'rgba(47,230,166,0.40)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: T.primary, fontSize: 24, fontWeight: '800' },
  name: { color: T.text, fontSize: 18, fontWeight: '700' },
  email: { color: T.textMuted, fontSize: 13, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: T.sm, paddingVertical: 8 },
  rowLabel: { color: T.text, fontSize: 14, fontWeight: '600' },
  rowValue: { color: T.textMuted, fontSize: 12, marginTop: 2 },
  linkBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 10,
  },
  linkBtnText: { color: T.primary, fontSize: 13, fontWeight: '600' },
  subLabel: { color: T.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: T.sm },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  choice: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1, borderColor: T.border,
    backgroundColor: T.bg,
  },
  choiceActive: {
    borderColor: T.primary,
    backgroundColor: 'rgba(47,230,166,0.08)',
  },
  choiceText: { color: T.textMuted, fontSize: 13, fontWeight: '600' },
  choiceTextActive: { color: T.primary },
  divider: { height: 1, backgroundColor: T.border, marginVertical: T.md },
  versionText: { color: T.textMuted, fontSize: 11, textAlign: 'center', opacity: 0.6 },
});

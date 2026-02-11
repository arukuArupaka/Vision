import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { getSupabase } from '@/lib/supabase/client';

export default function WelcomeScreen() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = getSupabase();
      const { data } = await supabase.auth.getUser();

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profile) {
          router.replace(profile.role === 'high_school' ? '/student' : '/senpai');
          return;
        }
        router.replace('/auth/login');
        return;
      }

      setChecking(false);
    };

    checkUser();
  }, [router]);

  const handleRoleSelect = (role: 'high_school' | 'university') => {
    router.push(`/auth/sign-up?role=${role}`);
  };

  if (checking) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.headerIcon}>
          <Text style={styles.headerIconText}>💬</Text>
        </View>
        <Text style={styles.title}>キャンパス・トークへようこそ！</Text>
        <Text style={styles.subtitle}>まずは、あなたのことを教えてください</Text>

        <TouchableOpacity
          style={[styles.roleButton, styles.roleButtonPrimary]}
          onPress={() => handleRoleSelect('high_school')}
        >
          <Text style={styles.roleTitle}>高校生です</Text>
          <Text style={styles.roleDescription}>大学生の先輩に質問・相談したい方</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleButton, styles.roleButtonSecondary]}
          onPress={() => handleRoleSelect('university')}
        >
          <Text style={styles.roleTitle}>大学生です</Text>
          <Text style={styles.roleDescription}>高校生のギモンに答えてあげたい方</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    padding: 24,
  },
  center: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#ffffff',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    gap: 16,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  headerIconText: {
    fontSize: 28,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#64748B',
  },
  roleButton: {
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    gap: 6,
  },
  roleButtonPrimary: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  roleButtonSecondary: {
    borderColor: '#38BDF8',
    backgroundColor: '#F0F9FF',
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  roleDescription: {
    fontSize: 12,
    color: '#64748B',
  },
});

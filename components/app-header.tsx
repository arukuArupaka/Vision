import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { getSupabase } from '@/lib/supabase/client'

interface AppHeaderProps {
  title: string
  subtitle: string
  variant?: 'primary' | 'secondary'
}

export function AppHeader({ title, subtitle, variant = 'primary' }: AppHeaderProps) {
  const router = useRouter()
  const bgColor = variant === 'primary' ? '#2563EB' : '#0EA5E9'

  const handleLogout = async () => {
    const supabase = getSupabase()
    await supabase.auth.signOut()
    router.replace('/')
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.left}>
        <Ionicons name="chatbubble-ellipses" size={22} color="#ffffff" />
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => router.push('/chat')}
          style={styles.iconButton}
          accessibilityLabel="チャット"
        >
          <Ionicons name="chatbubbles" size={20} color="#ffffff" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.iconButton}
          accessibilityLabel="ログアウト"
        >
          <Ionicons name="log-out" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    color: '#E2E8F0',
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
})

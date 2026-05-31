import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { getSupabase } from '@/lib/supabase/client'

interface AppHeaderProps {
  title: string
  subtitle: string
  variant?: 'primary' | 'secondary'
  showBack?: boolean
  onBackPress?: () => void
}

export function AppHeader({
  title,
  subtitle,
  variant = 'primary',
  showBack = false,
  onBackPress,
}: AppHeaderProps) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const bgColor = variant === 'primary' ? '#f97316' : '#fb923c'

  const handleBack = () => {
    if (onBackPress) {
      onBackPress()
      return
    }
    router.back()
  }

  const handleLogout = async () => {
    Alert.alert(
      'ログアウト',
      'ログアウトしてもよろしいですか？',
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: 'ログアウト',
          style: 'destructive',
          onPress: async () => {
            const supabase = getSupabase()
            await supabase.auth.signOut()
            router.replace('/')
          },
        },
      ]
    )
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: bgColor, paddingTop: insets.top + 12 },
      ]}
    >
      <View style={styles.left}>
        {showBack ? (
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            accessibilityLabel="戻る"
          >
            <Ionicons name="chevron-back" size={18} color="#ffffff" />
          </TouchableOpacity>
        ) : null}
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
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
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

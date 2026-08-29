import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
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
  const [isDeleting, setIsDeleting] = useState(false)

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

  const handleDeleteAccount = () => {
    Alert.alert(
      'アカウント削除',
      'アカウントを削除しますか？この操作は元に戻せません。アカウントに紐づくすべてのデータが完全に削除されます。',
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '削除する',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true)
              const supabase = getSupabase()

              const { data: { user } } = await supabase.auth.getUser()

              if (!user) {
                Alert.alert('エラー', 'ログイン中のユーザーが見つかりませんでした。')
                return
              }

              const relatedDeletes = [
                () => supabase.from('blocks').delete().or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`),
                () => supabase.from('reports').delete().or(`reporter_id.eq.${user.id},reported_id.eq.${user.id}`),
                () => supabase.from('messages').delete().eq('sender_id', user.id),
                () => supabase.from('answers').delete().eq('user_id', user.id),
                () => supabase.from('questions').delete().eq('user_id', user.id),
                () => supabase.from('chat_rooms').delete().or(`high_school_user_id.eq.${user.id},university_user_id.eq.${user.id}`),
                () => supabase.from('profiles').delete().eq('id', user.id),
              ]

              for (const deleteFn of relatedDeletes) {
                const { error } = await deleteFn()
                if (error) {
                  console.warn('Cleanup delete failed', error.message)
                }
              }

              const { error: rpcError } = await supabase.rpc('delete_user', { target_user_id: user.id })
              if (rpcError) {
                console.error('delete_user RPC failed', rpcError)
                throw rpcError
              }

              await supabase.auth.signOut()
              router.replace('/')
            } catch (error) {
              console.error('Account deletion error:', error)
              Alert.alert('エラー', '退会処理に失敗しました。関連データの削除や Supabase 側の delete_user 関数が設定されているかを確認してください。')
            } finally {
              setIsDeleting(false)
            }
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
          disabled={isDeleting}
        >
          <Ionicons name="chatbubbles" size={20} color="#ffffff" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleDeleteAccount}
          style={styles.iconButton}
          accessibilityLabel="アカウント削除"
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator size={20} color="#ffffff" />
          ) : (
            <Ionicons name="person-remove" size={20} color="#ffffff" />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.iconButton}
          accessibilityLabel="ログアウト"
          disabled={isDeleting}
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

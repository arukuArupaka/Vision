import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { getBlockedUserIds } from '@/lib/moderation'
import { getSupabase } from '@/lib/supabase/client'

interface Profile {
  id: string
  nickname: string
  role: string
  school_name: string | null
  grade: string | null
  faculty: string | null
  year: string | null
}

interface ChatRoom {
  id: string
  created_at: string
  high_school_user_id: string
  university_user_id: string
  high_school_last_read_at?: string | null
  university_last_read_at?: string | null
  other_user: Profile
  last_message?: {
    content: string
    created_at: string
    image_url?: string | null
  }
  unread_count?: number
}

export default function ChatListScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    const supabase = getSupabase()
    const { data } = await supabase.auth.getUser()

    if (!data.user) {
      router.replace('/auth/login')
      return
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (!profileData) {
      router.replace('/')
      return
    }

    setProfile(profileData)

    const { data: rooms } = await supabase
      .from('chat_rooms')
      .select('*')
      .or(`high_school_user_id.eq.${data.user.id},university_user_id.eq.${data.user.id}`)
      .order('created_at', { ascending: false })

    const blockedUserIds = await getBlockedUserIds(supabase, data.user.id)

    if (rooms) {
      const roomsWithUsers = await Promise.all(
        rooms.map(async (room) => {
          const otherUserId = profileData.role === 'high_school'
            ? room.university_user_id
            : room.high_school_user_id

          const { data: otherUser } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', otherUserId)
            .single()

          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content, created_at, image_url')
            .eq('chat_room_id', room.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          const lastReadAt = profileData.role === 'high_school'
            ? room.high_school_last_read_at
            : room.university_last_read_at

          const { count: unreadCount } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('chat_room_id', room.id)
            .neq('sender_id', data.user.id)
            .gt('created_at', lastReadAt || '1970-01-01T00:00:00Z')

          return {
            ...room,
            other_user: otherUser,
            last_message: lastMessage,
            unread_count: unreadCount || 0,
          }
        })
      )

      setChatRooms(
        roomsWithUsers.filter((r) => r.other_user && !blockedUserIds.has(r.other_user.id))
      )
    }

    setLoading(false)
  }, [router])

  useEffect(() => {
    loadData()
  }, [loadData])

  useFocusEffect(
    useCallback(() => {
      loadData()
    }, [loadData])
  )

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
    }
    if (days === 1) {
      return '昨日'
    }
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    )
  }

  const backUrl = profile?.role === 'high_school' ? '/student' : '/senpai'

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => router.replace(backUrl || '/')}
          style={styles.backButton}
          accessibilityLabel="戻る"
        >
          <Ionicons name="chevron-back" size={18} color="#7c2d12" />
          <Text style={styles.backText}>戻る</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>チャット</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {chatRooms.length === 0 ? (
          <Text style={styles.emptyText}>まだチャットがありません</Text>
        ) : (
          chatRooms.map((room) => (
            <TouchableOpacity
              key={room.id}
              style={styles.card}
              onPress={() => router.push(`/chat/${room.id}`)}
            >
              {(() => {
                const hasText = room.last_message?.content?.trim()
                const hasImage = !!room.last_message?.image_url
                const lastMessageText = hasText
                  ? room.last_message?.content
                  : hasImage
                    ? '写真を送信しました'
                    : ''

                return (
                  <>
                    <Text style={styles.cardTitle}>{room.other_user?.nickname}</Text>
                    <Text style={styles.cardSubtitle}>
                      {room.other_user?.role === 'high_school'
                        ? `${room.other_user?.school_name || ''} ${room.other_user?.grade || ''}`
                        : `${room.other_user?.faculty || ''} ${room.other_user?.year || ''}`}
                    </Text>
                    {room.last_message ? (
                      <View style={styles.lastMessageRow}>
                        <Text style={styles.lastMessage} numberOfLines={1}>
                          {lastMessageText}
                        </Text>
                        <View style={styles.lastMessageMeta}>
                          <Text style={styles.lastMessageTime}>
                            {formatTime(room.last_message.created_at)}
                          </Text>
                          {room.unread_count ? (
                            <View style={styles.unreadBadge}>
                              <Text style={styles.unreadBadgeText}>
                                {room.unread_count}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    ) : null}
                  </>
                )
              })()}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFEDD5',
  },
  backText: {
    color: '#7c2d12',
    fontSize: 12,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  list: {
    padding: 20,
    gap: 12,
  },
  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 40,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  lastMessageRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  lastMessageMeta: {
    alignItems: 'flex-end',
    gap: 6,
  },
  lastMessage: {
    flex: 1,
    color: '#475569',
  },
  lastMessageTime: {
    color: '#94A3B8',
    fontSize: 12,
  },
  unreadBadge: {
    minWidth: 22,
    paddingHorizontal: 6,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f97316',
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
})

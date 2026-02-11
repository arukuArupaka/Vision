import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'

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
  other_user: Profile
  last_message?: {
    content: string
    created_at: string
  }
}

export default function ChatListScreen() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
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
              .select('content, created_at')
              .eq('chat_room_id', room.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single()

            return {
              ...room,
              other_user: otherUser,
              last_message: lastMessage,
            }
          })
        )

        setChatRooms(roomsWithUsers.filter((r) => r.other_user))
      }

      setLoading(false)
    }

    loadData()
  }, [router])

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
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    )
  }

  const backUrl = profile?.role === 'high_school' ? '/student' : '/senpai'

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace(backUrl || '/')}> 
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
              <Text style={styles.cardTitle}>{room.other_user?.nickname}</Text>
              <Text style={styles.cardSubtitle}>
                {room.other_user?.role === 'high_school'
                  ? `${room.other_user?.school_name || ''} ${room.other_user?.grade || ''}`
                  : `${room.other_user?.faculty || ''} ${room.other_user?.year || ''}`}
              </Text>
              {room.last_message ? (
                <View style={styles.lastMessageRow}>
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    {room.last_message.content}
                  </Text>
                  <Text style={styles.lastMessageTime}>
                    {formatTime(room.last_message.created_at)}
                  </Text>
                </View>
              ) : null}
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
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backText: {
    color: '#2563EB',
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
  lastMessage: {
    flex: 1,
    color: '#475569',
  },
  lastMessageTime: {
    color: '#94A3B8',
    fontSize: 12,
  },
})

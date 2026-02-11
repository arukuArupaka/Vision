import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
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

interface Message {
  id: string
  content: string
  created_at: string
  sender_id: string
}

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>()
  const roomId = Array.isArray(id) ? id[0] : id
  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [otherUser, setOtherUser] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<ScrollView>(null)

  const addMessage = (message: Message) => {
    setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]))
  }

  const scrollToBottom = () => {
    scrollRef.current?.scrollToEnd({ animated: true })
  }

  useEffect(() => {
    const loadData = async () => {
      if (!roomId) return

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

      const { data: room } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('id', roomId)
        .single()

      if (!room) {
        router.replace('/chat')
        return
      }

      const otherUserId = profileData.role === 'high_school'
        ? room.university_user_id
        : room.high_school_user_id

      const { data: otherUserData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', otherUserId)
        .single()

      setOtherUser(otherUserData)

      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_room_id', roomId)
        .order('created_at', { ascending: true })

      setMessages(messagesData || [])
      setLoading(false)
    }

    loadData()
  }, [roomId, router])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!roomId) return

    const supabase = getSupabase()
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_room_id=eq.${roomId}`,
        },
        (payload) => {
          addMessage(payload.new as Message)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !profile || !roomId) return

    setSending(true)
    const supabase = getSupabase()

    const { data: inserted, error } = await supabase
      .from('messages')
      .insert({
      chat_room_id: roomId,
      sender_id: profile.id,
      content: newMessage.trim(),
      })
      .select('*')
      .single()

    if (!error && inserted) {
      addMessage(inserted as Message)
    }

    setNewMessage('')
    setSending(false)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/chat')}>
          <Text style={styles.backText}>戻る</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{otherUser?.nickname}</Text>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.messagesContainer}>
        {messages.map((message) => {
          const isMine = message.sender_id === profile?.id
          return (
            <View
              key={message.id}
              style={[styles.messageBubble, isMine ? styles.messageMine : styles.messageOther]}
            >
              <Text style={[styles.messageText, isMine && styles.messageTextMine]}>
                {message.content}
              </Text>
              <Text style={[styles.messageTime, isMine && styles.messageTimeMine]}>
                {formatTime(message.created_at)}
              </Text>
            </View>
          )
        })}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="メッセージを入力..."
          value={newMessage}
          onChangeText={setNewMessage}
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSendMessage}
          disabled={sending || !newMessage.trim()}
        >
          <Text style={styles.sendButtonText}>送信</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  messagesContainer: {
    padding: 20,
    gap: 12,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  messageMine: {
    alignSelf: 'flex-end',
    backgroundColor: '#2563EB',
  },
  messageOther: {
    alignSelf: 'flex-start',
    backgroundColor: '#E2E8F0',
  },
  messageText: {
    color: '#0F172A',
  },
  messageTextMine: {
    color: '#ffffff',
  },
  messageTime: {
    marginTop: 4,
    fontSize: 10,
    color: '#475569',
  },
  messageTimeMine: {
    color: '#DBEAFE',
  },
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sendButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
})

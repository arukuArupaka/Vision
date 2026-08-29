import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { blockUser, containsInappropriateContent, reportContent } from '@/lib/moderation'
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
  image_url?: string | null
}

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>()
  const roomId = Array.isArray(id) ? id[0] : id
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [otherUser, setOtherUser] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sendingImage, setSendingImage] = useState(false)
  const [authUserId, setAuthUserId] = useState<string | null>(null)
  const scrollRef = useRef<ScrollView>(null)

  const addMessage = (message: Message) => {
    setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]))
  }

  const scrollToBottom = () => {
    scrollRef.current?.scrollToEnd({ animated: true })
  }

  const validateMessage = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return null

    if (containsInappropriateContent(trimmed)) {
      return '不適切な表現が含まれているため送信できません'
    }

    const hasUrl = /(https?:\/\/|www\.)/i.test(trimmed)
    if (hasUrl) return 'この投稿はできません'

    const hasLongRepeat = /(.)\1{7,}/.test(trimmed)
    if (hasLongRepeat) return 'この投稿はできません'

    return null
  }

  const markRoomAsRead = async (roleOverride?: Profile['role']) => {
    const role = roleOverride || profile?.role
    if (!roomId || !role) return

    const supabase = getSupabase()
    const updateField = role === 'high_school'
      ? 'high_school_last_read_at'
      : 'university_last_read_at'

    const { error } = await supabase
      .from('chat_rooms')
      .update({ [updateField]: new Date().toISOString() })
      .eq('id', roomId)
    if (error) {
      console.warn('markRoomAsRead failed', error.message)
    }
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

      setAuthUserId(data.user.id)

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
      await markRoomAsRead(profileData.role)
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
          const nextMessage = payload.new as Message
          addMessage(nextMessage)
          if (nextMessage.sender_id !== authUserId) {
            markRoomAsRead()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, authUserId])

  useEffect(() => {
    if (messages.length > 0) {
      markRoomAsRead()
    }
  }, [messages.length])

  const handleSendMessage = async () => {
    const trimmed = newMessage.trim()
    if (!trimmed || !profile || !roomId) return

    const errorMessage = validateMessage(trimmed)
    if (errorMessage) {
      setValidationError(errorMessage)
      return
    }

    setSending(true)
    const supabase = getSupabase()
    const { data: authData } = await supabase.auth.getUser()
    const senderId = authData.user?.id

    if (!senderId) {
      setSending(false)
      return
    }

    const { data: inserted, error } = await supabase
      .from('messages')
      .insert({
      chat_room_id: roomId,
      sender_id: senderId,
      content: trimmed,
      })
      .select('*')
      .single()

    if (!error && inserted) {
      addMessage(inserted as Message)
    }

    setNewMessage('')
    setValidationError(null)
    setSending(false)
  }

  const handlePickImage = async () => {
    if (!profile || !roomId || sendingImage) return

    if (newMessage.trim()) {
      const errorMessage = validateMessage(newMessage)
      if (errorMessage) {
        setValidationError(errorMessage)
        return
      }
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) return

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images' as const],
      quality: 0.8,
    })

    if (result.canceled || !result.assets?.length) return

    const asset = result.assets[0]
    if (!asset.uri) return

    setSendingImage(true)
    const supabase = getSupabase()
    const { data: authData } = await supabase.auth.getUser()
    const senderId = authData.user?.id

    if (!senderId) {
      setSendingImage(false)
      return
    }

    const extension = asset.uri.split('.').pop()?.split('?')[0] || 'jpg'
    const filePath = `chat/${roomId}/${profile.id}/${Date.now()}.${extension}`
    const contentType = asset.mimeType || `image/${extension === 'jpg' ? 'jpeg' : extension}`
    const file = {
      uri: asset.uri,
      name: `chat-${Date.now()}.${extension}`,
      type: contentType,
    } as unknown as File

    const { error: uploadError } = await supabase
      .storage
      .from('chat-images')
      .upload(filePath, file, { contentType })

    if (uploadError) {
      console.warn(uploadError.message)
      setSendingImage(false)
      return
    }

    const { data: publicData } = supabase
      .storage
      .from('chat-images')
      .getPublicUrl(filePath)

    const { data: inserted, error } = await supabase
      .from('messages')
      .insert({
        chat_room_id: roomId,
        sender_id: senderId,
        content: newMessage.trim() || '写真',
        image_url: publicData.publicUrl,
      })
      .select('*')
      .single()

    if (!error && inserted) {
      addMessage(inserted as Message)
    }

    setNewMessage('')
    setValidationError(null)
    setSendingImage(false)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
  }

  const handleOptions = () => {
    Alert.alert(
      'オプション',
      `${otherUser?.nickname || 'このユーザー'}に対する操作を選択してください`,
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: 'ブロックする',
          style: 'destructive',
          onPress: handleBlockUser,
        },
        {
          text: '問題を報告する',
          style: 'default',
          onPress: handleReportUser,
        },
      ]
    )
  }

  const handleBlockUser = async () => {
    if (!profile || !otherUser) return
    Alert.alert(
      'ブロックの確認',
      'このユーザーをブロックしますか？ブロックすると相手の投稿とメッセージが画面から消え、運営へ通知されます。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'ブロック',
          style: 'destructive',
          onPress: async () => {
            const supabase = getSupabase()
            const blocked = await blockUser({
              supabase,
              blockerId: profile.id,
              blockedId: otherUser.id,
            })

            await reportContent({
              supabase,
              reporterId: profile.id,
              reportedUserId: otherUser.id,
              reportType: 'user_block',
              reason: 'ユーザーをブロックしたため運営へ通知',
              contentPreview: `${otherUser.nickname}のブロック`,
            })

            if (blocked) {
              Alert.alert('完了', 'ユーザーをブロックしました。運営へ通知済みです。')
              router.replace('/chat')
              return
            }

            Alert.alert('エラー', 'ブロックに失敗しました。もう一度お試しください。')
          },
        },
      ]
    )
  }

  const handleReportUser = () => {
    if (!profile || !otherUser) return
    Alert.prompt(
      '問題を報告',
      '報告の理由を入力してください。24時間以内に運営が確認して対応します。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '送信',
          onPress: async (reason?: string | null) => {
            const cleanReason = reason?.trim() || ''
            if (!cleanReason) return
            const supabase = getSupabase()
            const success = await reportContent({
              supabase,
              reporterId: profile.id,
              reportedUserId: otherUser.id,
              reportType: 'chat_user',
              reason: cleanReason,
              contentPreview: `chat-user:${otherUser.nickname}`,
            })

            Alert.alert(
              success ? 'ご報告ありがとうございます' : '送信エラー',
              success
                ? '運営へ通知しました。24時間以内に確認・対応します。'
                : '報告の送信に失敗しました。もう一度お試しください。'
            )
          },
        },
      ]
    )
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => router.replace('/chat')}
          style={styles.backButton}
          accessibilityLabel="戻る"
        >
          <Ionicons name="chevron-back" size={18} color="#7c2d12" />
          <Text style={styles.backText}>戻る</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{otherUser?.nickname}</Text>
        <View style={styles.headerSpacer} />
        <TouchableOpacity onPress={handleOptions} accessibilityLabel="オプション">
          <Ionicons name="ellipsis-vertical" size={24} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.messagesContainer}>
        {messages.map((message) => {
          const isMine = message.sender_id === profile?.id
          return (
            <View
              key={message.id}
              style={[styles.messageBubble, isMine ? styles.messageMine : styles.messageOther]}
            >
              {message.image_url ? (
                <Image
                  source={{ uri: message.image_url }}
                  style={styles.messageImage}
                  contentFit="cover"
                />
              ) : null}
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

      {validationError ? (
        <Text style={styles.validationError}>{validationError}</Text>
      ) : null}
      <View style={styles.inputRow}>
        <TouchableOpacity
          style={styles.imageButton}
          onPress={handlePickImage}
          disabled={sendingImage}
          accessibilityLabel="写真を追加"
        >
          <Ionicons name="image" size={20} color="#7c2d12" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="メッセージを入力..."
          value={newMessage}
          onChangeText={(text) => {
            setNewMessage(text)
            setValidationError(validateMessage(text))
          }}
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSendMessage}
          disabled={sending || sendingImage || !newMessage.trim() || !!validationError}
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
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  headerSpacer: {
    flex: 1,
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
    gap: 6,
  },
  messageMine: {
    alignSelf: 'flex-end',
    backgroundColor: '#f97316',
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
  messageImage: {
    width: 220,
    height: 140,
    borderRadius: 12,
  },
  messageTime: {
    marginTop: 4,
    fontSize: 10,
    color: '#475569',
  },
  messageTimeMine: {
    color: '#FFEDD5',
  },
  validationError: {
    marginHorizontal: 12,
    marginBottom: 6,
    color: '#b91c1c',
    fontSize: 12,
  },
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
  },
  imageButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEDD5',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sendButton: {
    backgroundColor: '#f97316',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
})

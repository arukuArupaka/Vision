import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'

import { getSupabase } from '@/lib/supabase/client'

interface Answer {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: {
    nickname: string
    faculty: string | null
    year: string | null
    home_school: string | null
  }
}

interface Question {
  id: string
  title: string
  content: string
  created_at: string
  user_id: string
  profiles: {
    nickname: string
    school_name: string | null
    grade: string | null
  }
  answers: Answer[]
}

interface QuestionCardProps {
  question: Question
  currentUserId?: string
  variant?: 'student' | 'senpai'
  onDelete?: (id: string) => void
  onAnswerPosted?: () => void
}

export function QuestionCard({
  question,
  currentUserId,
  variant = 'student',
  onDelete,
  onAnswerPosted,
}: QuestionCardProps) {
  const router = useRouter()
  const [answer, setAnswer] = useState('')
  const [sending, setSending] = useState(false)

  const handleStartChat = async (universityUserId: string) => {
    if (!currentUserId) return

    const supabase = getSupabase()

    const { data: existingRoom } = await supabase
      .from('chat_rooms')
      .select('id')
      .eq('high_school_user_id', currentUserId)
      .eq('university_user_id', universityUserId)
      .single()

    if (existingRoom?.id) {
      router.push(`/chat/${existingRoom.id}`)
      return
    }

    const { data: newRoom } = await supabase
      .from('chat_rooms')
      .insert({
        high_school_user_id: currentUserId,
        university_user_id: universityUserId,
      })
      .select('id')
      .single()

    if (newRoom?.id) {
      router.push(`/chat/${newRoom.id}`)
    }
  }

  const handleAnswer = async () => {
    if (!currentUserId || !answer.trim()) return
    setSending(true)

    const supabase = getSupabase()
    await supabase.from('answers').insert({
      content: answer.trim(),
      user_id: currentUserId,
      question_id: question.id,
    })

    setAnswer('')
    setSending(false)
    onAnswerPosted?.()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const isOwner = currentUserId === question.user_id
  const isSenpai = variant === 'senpai'

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{question.title}</Text>
        {isOwner && onDelete ? (
          <TouchableOpacity onPress={() => onDelete(question.id)}>
            <Text style={styles.deleteText}>削除</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={styles.content}>{question.content}</Text>
      <Text style={styles.meta}>
        {question.profiles?.nickname} ・ {question.profiles?.school_name || ''} {question.profiles?.grade || ''}
      </Text>
      <Text style={styles.dateText}>{formatDate(question.created_at)}</Text>

      {isSenpai ? (
        <View style={styles.answerForm}>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="回答を書く..."
            value={answer}
            onChangeText={setAnswer}
            multiline
          />
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleAnswer}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>回答する</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}

      {question.answers?.length ? (
        <View style={styles.answerList}>
          {question.answers.map((item) => (
            <View key={item.id} style={styles.answerCard}>
              <Text style={styles.answerContent}>{item.content}</Text>
              <Text style={styles.answerMeta}>
                {item.profiles?.nickname} ・ {item.profiles?.faculty || ''} {item.profiles?.year || ''}
              </Text>
              {!isSenpai && isOwner ? (
                <TouchableOpacity
                  style={styles.chatButton}
                  onPress={() => handleStartChat(item.user_id)}
                >
                  <Text style={styles.chatButtonText}>チャット</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  deleteText: {
    color: '#EF4444',
    fontSize: 12,
  },
  content: {
    marginTop: 8,
    color: '#334155',
  },
  meta: {
    marginTop: 6,
    fontSize: 12,
    color: '#64748B',
  },
  dateText: {
    marginTop: 2,
    fontSize: 11,
    color: '#94A3B8',
  },
  answerForm: {
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textarea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: '#0EA5E9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  answerList: {
    marginTop: 12,
    gap: 8,
  },
  answerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  answerContent: {
    color: '#0F172A',
  },
  answerMeta: {
    marginTop: 6,
    fontSize: 12,
    color: '#64748B',
  },
  chatButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
    backgroundColor: '#0EA5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  chatButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
})

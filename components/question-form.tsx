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

interface Profile {
  id: string
  nickname: string
  school_name: string | null
  grade: string | null
}

interface QuestionFormProps {
  profile: Profile
  onQuestionPosted: (question: any) => void
}

export function QuestionForm({ profile, onQuestionPosted }: QuestionFormProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return

    setLoading(true)
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('questions')
      .insert({
        user_id: profile.id,
        title: title.trim(),
        content: content.trim(),
      })
      .select(
        `
          *,
          profiles!questions_user_id_fkey (nickname, school_name, grade)
        `
      )
      .single()

    if (!error && data) {
      onQuestionPosted({ ...data, answers: [] })
      setTitle('')
      setContent('')
    }

    setLoading(false)
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>先輩に質問してみよう！</Text>

      <View style={styles.profileRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile.nickname?.slice(0, 1) || '？'}</Text>
        </View>
        <View>
          <Text style={styles.profileName}>{profile.nickname}さんとして投稿</Text>
          <Text style={styles.profileMeta}>
            {profile.school_name} ({profile.grade})
          </Text>
        </View>
      </View>

      <Text style={styles.label}>質問のタイトル</Text>
      <TextInput
        placeholder="例：理系と文系どっちがいい？"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />

      <Text style={styles.label}>相談内容</Text>
      <TextInput
        placeholder="悩んでいることや聞きたいことを詳しく書いてね！"
        value={content}
        onChangeText={setContent}
        style={[styles.input, styles.textarea]}
        multiline
      />

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleSubmit}
        disabled={loading || !title.trim() || !content.trim()}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.primaryButtonText}>質問を公開する</Text>
        )}
      </TouchableOpacity>
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563EB',
  },
  profileRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#2563EB',
    fontWeight: '700',
  },
  profileName: {
    color: '#1E3A8A',
    fontWeight: '600',
  },
  profileMeta: {
    fontSize: 12,
    color: '#64748B',
  },
  label: {
    marginTop: 12,
    marginBottom: 6,
    color: '#0F172A',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textarea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
})

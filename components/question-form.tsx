import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

import { getSupabase } from '@/lib/supabase/client'
import { HASHTAG_OPTIONS } from '../constants/hashtags'
import { HashtagSelector } from './hashtag-selector'

interface Profile {
  id: string
  role: string
  nickname: string
  school_name: string | null
  grade: string | null
}

interface QuestionFormProps {
  profile: Profile
  onQuestionPosted: (question: any) => void
}

export function QuestionForm({ profile, onQuestionPosted }: QuestionFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [hashtags, setHashtags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return

    setLoading(true)
    const supabase = getSupabase()

    try {
      const { data, error } = await supabase
        .from('questions')
        .insert({
          user_id: profile.id,
          title: title.trim(),
          content: content.trim(),
          hashtags,
        })
        .select(
          `
            *,
            profiles!questions_user_id_fkey (nickname, school_name, grade)
          `
        )
        .single()

      if (error) {
        console.error('Supabase insert error:', error)
        Alert.alert('送信エラー', 'ネットワークエラーが発生しました。後でもう一度試してください。')
        return
      }

      if (data) {
        let parsedHashtags = data.hashtags
        if (typeof data.hashtags === 'string') {
          try {
            parsedHashtags = JSON.parse(data.hashtags)
          } catch (e) {
            parsedHashtags = []
          }
        }
        
        onQuestionPosted({ ...data, hashtags: parsedHashtags, answers: [] })
        setTitle('')
        setContent('')
        setHashtags([])
      }
    } catch (err) {
      console.error('Network error while posting question:', err)
      Alert.alert('送信できません', 'ネットワークに接続できません。接続を確認してください。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>先輩に質問してみよう！</Text>

      <TouchableOpacity
        style={styles.profileRow}
        onPress={() => router.push('/profile/setup?mode=edit')}
        accessibilityLabel="プロフィールを編集"
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile.nickname?.slice(0, 1) || '？'}</Text>
        </View>
        <View>
          <Text style={styles.profileName}>{profile.nickname}さんとして投稿</Text>
          <Text style={styles.profileMeta}>
            {profile.school_name} ({profile.grade})
          </Text>
        </View>
      </TouchableOpacity>

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

      <HashtagSelector
        title="ハッシュタグ"
        description="質問に合うタグを選ぶと、興味のある大学生に届きやすくなります"
        options={HASHTAG_OPTIONS}
        value={hashtags}
        onChange={setHashtags}
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
    color: '#f97316',
  },
  profileRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFEDD5',
    borderRadius: 12,
    padding: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#f97316',
    fontWeight: '700',
  },
  profileName: {
    color: '#7c2d12',
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
    borderColor: '#FED7AA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textarea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: '#f97316',
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

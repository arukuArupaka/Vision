import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { AppHeader } from '@/components/app-header'
import { QuestionCard } from '@/components/question-card'
import { HASHTAG_OPTIONS } from '@/constants/hashtags'
import { containsInappropriateContent, getBlockedUserIds } from '@/lib/moderation'
import { getSupabase } from '@/lib/supabase/client'

interface Profile {
  id: string
  nickname: string
  role: string
  faculty: string | null
  year: string | null
  home_school: string | null
  notification_hashtags: string[] | null
}

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
  hashtags?: string[] | null
  created_at: string
  user_id: string
  profiles: {
    nickname: string
    school_name: string | null
    grade: string | null
  }
  answers: Answer[]
}

export default function SenpaiDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null)

  const loadQuestions = async (userId?: string) => {
    const supabase = getSupabase()
    const { data: questionsData } = await supabase
      .from('questions')
      .select(
        `
          *,
          profiles!questions_user_id_fkey (nickname, school_name, grade),
          answers (
            *,
            profiles!answers_user_id_fkey (nickname, faculty, year, home_school)
          )
        `
      )
      .order('created_at', { ascending: false })

    const blockedUserIds = await getBlockedUserIds(supabase, userId ?? profile?.id)

    const parsedQuestions = (questionsData || [])
      .filter((q: any) => {
        if (blockedUserIds.has(q.user_id)) return false
        const textToCheck = `${q.title || ''} ${q.content || ''}`
        return !containsInappropriateContent(textToCheck)
      })
      .map((q: any) => {
        let parsedHashtags = q.hashtags
        if (typeof q.hashtags === 'string') {
          try {
            parsedHashtags = JSON.parse(q.hashtags)
          } catch (e) {
            parsedHashtags = []
          }
        }

        const safeAnswers = (q.answers || []).filter((answer: any) => !blockedUserIds.has(answer.user_id))
        return { ...q, hashtags: parsedHashtags, answers: safeAnswers }
      })

    setQuestions(parsedQuestions)
  }

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
        router.replace('/profile/setup?role=university')
        return
      }

      if (profileData.role !== 'university') {
        router.replace('/student')
        return
      }

      setProfile(profileData)
      await loadQuestions(profileData.id)
      setLoading(false)
    }

    loadData()
  }, [router])

  const handleAnswerPosted = async () => {
    await loadQuestions(profile?.id)
  }

  const refreshQuestions = async () => {
    await handleAnswerPosted()
  }

  const handleUserBlocked = (blockedUserId: string) => {
    setQuestions((current) => current.filter((question) => question.user_id !== blockedUserId))
  }

  const notificationTags = profile?.notification_hashtags || []
  const matchedQuestions = notificationTags.length
    ? questions.filter((question) =>
        Array.isArray(question.hashtags) && question.hashtags.some((tag) => notificationTags.includes(tag))
      )
    : []
  const orderedQuestions = notificationTags.length
    ? [...questions].sort((left, right) => {
        const leftMatched = Array.isArray(left.hashtags) && left.hashtags.some((tag) => notificationTags.includes(tag)) ? 1 : 0
        const rightMatched = Array.isArray(right.hashtags) && right.hashtags.some((tag) => notificationTags.includes(tag)) ? 1 : 0
        return rightMatched - leftMatched
      })
    : questions

  const displayQuestions = selectedFilter
    ? questions.filter((q) => Array.isArray(q.hashtags) && q.hashtags.includes(selectedFilter))
    : orderedQuestions

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      <AppHeader
        title="キャンパス・トーク"
        subtitle="高校生の「ギモン」に大学生の「リアル」を"
        variant="secondary"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.container}>
        {profile ? (
          <TouchableOpacity
            style={styles.profileCard}
            onPress={() => router.push('/profile/setup?mode=edit')}
            accessibilityLabel="プロフィールを編集"
          >
            <Text style={styles.sectionTitle}>あなたのプロフィール</Text>
            <Text style={styles.profileText}>{profile.faculty} {profile.year}</Text>
            {profile.home_school ? (
              <Text style={styles.profileSubText}>出身: {profile.home_school}</Text>
            ) : null}
            {notificationTags.length ? (
              <Text style={styles.profileSubText}>
                通知タグ: {notificationTags.map((tag) => `#${tag}`).join(' ・ ')}
              </Text>
            ) : null}
          </TouchableOpacity>
        ) : null}

        {notificationTags.length ? (
          <View style={styles.matchCard}>
            <Text style={styles.sectionTitle}>通知対象の質問</Text>
            <Text style={styles.matchDescription}>
              {matchedQuestions.length}件があなたのタグ設定に一致しています
            </Text>
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>質問を探す</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === null && styles.filterChipSelected]}
            onPress={() => setSelectedFilter(null)}
          >
            <Text style={[styles.filterText, selectedFilter === null && styles.filterTextSelected]}>
              すべて
            </Text>
          </TouchableOpacity>
          {HASHTAG_OPTIONS.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[styles.filterChip, selectedFilter === tag && styles.filterChipSelected]}
              onPress={() => setSelectedFilter(tag)}
            >
              <Text style={[styles.filterText, selectedFilter === tag && styles.filterTextSelected]}>
                #{tag}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>質問に回答する</Text>
        </View>

        {displayQuestions.length === 0 ? (
          <Text style={styles.emptyText}>該当する質問がありません。</Text>
        ) : (
          displayQuestions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              currentUserId={profile?.id}
              onAnswerPosted={refreshQuestions}
              variant="senpai"
              onUserBlocked={handleUserBlocked}
            />
          ))
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    padding: 24,
    gap: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    marginTop: 4,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f97316',
  },
  profileCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: 16,
    marginBottom: 12,
  },
  profileText: {
    marginTop: 6,
    color: '#0F172A',
  },
  profileSubText: {
    marginTop: 4,
    color: '#475569',
    fontSize: 12,
  },
  matchCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  matchDescription: {
    marginTop: 4,
    color: '#475569',
    fontSize: 12,
  },
  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 40,
  },
  filterContainer: {
    gap: 8,
    paddingBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  filterChipSelected: {
    backgroundColor: '#f97316',
  },
  filterText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '500',
  },
  filterTextSelected: {
    color: '#ffffff',
  },
})

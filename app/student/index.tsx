import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'

import { AppHeader } from '@/components/app-header'
import { QuestionCard } from '@/components/question-card'
import { QuestionForm } from '@/components/question-form'
import { getSupabase } from '@/lib/supabase/client'

interface Profile {
  id: string
  nickname: string
  role: string
  school_name: string | null
  grade: string | null
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
  created_at: string
  user_id: string
  profiles: {
    nickname: string
    school_name: string | null
    grade: string | null
  }
  answers: Answer[]
}

export default function StudentDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  const loadQuestions = async () => {
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

    setQuestions(questionsData || [])
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
        router.replace('/profile/setup?role=high_school')
        return
      }

      if (profileData.role !== 'high_school') {
        router.replace('/senpai')
        return
      }

      setProfile(profileData)
      await loadQuestions()
      setLoading(false)
    }

    loadData()
  }, [router])

  const handleQuestionPosted = (newQuestion: Question) => {
    setQuestions((prev) => [newQuestion, ...prev])
  }

  const handleDeleteQuestion = async (questionId: string) => {
    const supabase = getSupabase()
    await supabase.from('questions').delete().eq('id', questionId)
    setQuestions(questions.filter((q) => q.id !== questionId))
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      <AppHeader
        title="キャンパス・トーク"
        subtitle="高校生の「ギモン」に大学生の「リアル」を"
        variant="primary"
      />

      <ScrollView contentContainerStyle={styles.container}>
        {profile ? (
          <QuestionForm profile={profile} onQuestionPosted={handleQuestionPosted} />
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>みんなの質問</Text>
        </View>

        {questions.length === 0 ? (
          <Text style={styles.emptyText}>まだ質問がありません。最初の質問を投稿してみましょう！</Text>
        ) : (
          questions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              currentUserId={profile?.id}
              onDelete={handleDeleteQuestion}
              variant="student"
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
    color: '#2563EB',
  },
  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 40,
  },
})

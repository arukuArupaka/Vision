import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'

import { AppHeader } from '@/components/app-header'
import { QuestionCard } from '@/components/question-card'
import { getSupabase } from '@/lib/supabase/client'

interface Profile {
  id: string
  nickname: string
  role: string
  faculty: string | null
  year: string | null
  home_school: string | null
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

export default function SenpaiDashboard() {
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
        router.replace('/profile/setup?role=university')
        return
      }

      if (profileData.role !== 'university') {
        router.replace('/student')
        return
      }

      setProfile(profileData)
      await loadQuestions()
      setLoading(false)
    }

    loadData()
  }, [router])

  const handleAnswerPosted = async () => {
    await loadQuestions()
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      <AppHeader
        title="キャンパス・トーク"
        subtitle="高校生の「ギモン」に大学生の「リアル」を"
        variant="secondary"
      />

      <ScrollView contentContainerStyle={styles.container}>
        {profile ? (
          <View style={styles.profileCard}>
            <Text style={styles.sectionTitle}>あなたのプロフィール</Text>
            <Text style={styles.profileText}>{profile.faculty} {profile.year}</Text>
            {profile.home_school ? (
              <Text style={styles.profileSubText}>出身: {profile.home_school}</Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>質問に回答する</Text>
        </View>

        {questions.length === 0 ? (
          <Text style={styles.emptyText}>まだ質問がありません。高校生からの質問を待ちましょう。</Text>
        ) : (
          questions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              currentUserId={profile?.id}
              onAnswerPosted={handleAnswerPosted}
              variant="senpai"
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
    color: '#0EA5E9',
  },
  profileCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
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
  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 40,
  },
})

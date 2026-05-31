import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

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

export default function StudentDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalVisible, setIsModalVisible] = useState(false)

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

    const parsedQuestions = (questionsData || []).map((q: any) => {
      let parsedHashtags = q.hashtags
      if (typeof q.hashtags === 'string') {
        try {
          parsedHashtags = JSON.parse(q.hashtags)
        } catch (e) {
          parsedHashtags = []
        }
      }
      return { ...q, hashtags: parsedHashtags }
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
    setIsModalVisible(false)
  }

  const handleDeleteQuestion = async (questionId: string) => {
    const supabase = getSupabase()
    await supabase.from('questions').delete().eq('id', questionId)
    setQuestions(questions.filter((q) => q.id !== questionId))
  }

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
        variant="primary"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.container}>
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

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsModalVisible(true)}
        accessibilityLabel="質問を投稿する"
      >
        <Ionicons name="pencil" size={24} color="#ffffff" />
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>質問を作成</Text>
            <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#0F172A" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            {profile ? (
              <QuestionForm profile={profile} onQuestionPosted={handleQuestionPosted} />
            ) : null}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 40,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
})

import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'

import { getSupabase } from '@/lib/supabase/client'

const HIGH_SCHOOL_GRADES = ['高校1年生', '高校2年生', '高校3年生']
const UNIVERSITY_YEARS = ['1回生', '2回生', '3回生', '4回生', '大学院生']
const GENDERS = ['回答しない', '男性', '女性', 'その他']

export default function ProfileSetupScreen() {
  const router = useRouter()
  const { role: rawRole } = useLocalSearchParams<{ role?: string | string[] }>()
  const roleParam = (Array.isArray(rawRole) ? rawRole[0] : rawRole) as
    | 'high_school'
    | 'university'
    | undefined

  const [role, setRole] = useState<'high_school' | 'university'>(roleParam || 'high_school')
  const [nickname, setNickname] = useState('')
  const [gender, setGender] = useState('回答しない')
  const [schoolName, setSchoolName] = useState('')
  const [grade, setGrade] = useState('')
  const [faculty, setFaculty] = useState('')
  const [year, setYear] = useState('')
  const [homeSchool, setHomeSchool] = useState('')
  const [bio, setBio] = useState('')
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const supabase = getSupabase()
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        setUserId(data.user.id)
        if (data.user.user_metadata?.role) {
          setRole(data.user.user_metadata.role)
        }
      } else {
        router.replace('/auth/login')
      }
      setInitializing(false)
    }

    getUser()
  }, [router])

  const isHighSchool = role === 'high_school'

  const handleSubmit = async () => {
    if (!userId) return

    setLoading(true)
    setError('')

    const supabase = getSupabase()
    const profileData = {
      id: userId,
      role,
      nickname,
      gender,
      school_name: isHighSchool ? schoolName : null,
      grade: isHighSchool ? grade : null,
      university_name: !isHighSchool ? schoolName : null,
      faculty: !isHighSchool ? faculty : null,
      year: !isHighSchool ? year : null,
      home_school: !isHighSchool ? homeSchool : null,
      bio: !isHighSchool ? bio : null,
    }

    const { error: insertError } = await supabase.from('profiles').insert(profileData)

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
    } else {
      router.replace(isHighSchool ? '/student' : '/senpai')
    }
  }

  if (initializing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>プロフィール設定</Text>
      <Text style={styles.subtitle}>掲示板で表示される情報です</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Text style={styles.label}>お名前 / ニックネーム</Text>
      <TextInput
        style={styles.input}
        placeholder="例：ゆうき"
        value={nickname}
        onChangeText={setNickname}
      />

      <Text style={styles.label}>性別（任意）</Text>
      <OptionList options={GENDERS} value={gender} onChange={setGender} />

      {isHighSchool ? (
        <>
          <Text style={styles.label}>通っている学校名</Text>
          <TextInput
            style={styles.input}
            placeholder="例：〇〇高校"
            value={schoolName}
            onChangeText={setSchoolName}
          />

          <Text style={styles.label}>学年</Text>
          <OptionList options={HIGH_SCHOOL_GRADES} value={grade} onChange={setGrade} />
        </>
      ) : (
        <>
          <Text style={styles.label}>大学・学部</Text>
          <TextInput
            style={styles.input}
            placeholder="例：工学部"
            value={faculty}
            onChangeText={setFaculty}
          />

          <Text style={styles.label}>学年</Text>
          <OptionList options={UNIVERSITY_YEARS} value={year} onChange={setYear} />

          <Text style={styles.label}>母校（出身高校）</Text>
          <TextInput
            style={styles.input}
            placeholder="例：〇〇県立△△高校"
            value={homeSchool}
            onChangeText={setHomeSchool}
          />

          <Text style={styles.label}>自己紹介</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="例：受験勉強のアドバイスが得意です！"
            value={bio}
            onChangeText={setBio}
            multiline
          />
        </>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.replace('/')}> 
          <Text style={styles.secondaryButtonText}>戻る</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.primaryButtonText}>登録を完了する</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

function OptionList({
  options,
  value,
  onChange,
}: {
  options: string[]
  value: string
  onChange: (next: string) => void
}) {
  return (
    <View style={styles.optionList}>
      {options.map((option) => {
        const selected = option === value
        return (
          <TouchableOpacity
            key={option}
            style={[styles.optionItem, selected && styles.optionItemSelected]}
            onPress={() => onChange(option)}
          >
            <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{option}</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#ffffff',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    color: '#64748B',
    marginBottom: 16,
  },
  label: {
    color: '#0F172A',
    marginBottom: 6,
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
  errorText: {
    color: '#EF4444',
  },
  optionList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CBD5F5',
  },
  optionItemSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  optionText: {
    fontSize: 12,
    color: '#0F172A',
  },
  optionTextSelected: {
    color: '#ffffff',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5F5',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#0F172A',
    fontWeight: '700',
  },
})

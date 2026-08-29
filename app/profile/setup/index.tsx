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
import { HashtagSelector } from '../../../components/hashtag-selector'
import { HASHTAG_OPTIONS } from '../../../constants/hashtags'

const HIGH_SCHOOL_GRADES = ['高校1年生', '高校2年生', '高校3年生']
const HIGH_SCHOOL_NAMES = ['立命館高校', '立命館守山高校', '立命館宇治高校']
const UNIVERSITY_YEARS = ['1回生', '2回生', '3回生', '4回生', '大学院生']
const GENDERS = ['回答しない', '男性', '女性', 'その他']

export default function ProfileSetupScreen() {
  const router = useRouter()
  const { role: rawRole, mode } = useLocalSearchParams<{ role?: string | string[]; mode?: string }>()
  const roleParam = (Array.isArray(rawRole) ? rawRole[0] : rawRole) as
    | 'high_school'
    | 'university'
    | undefined
  const isEditing = mode === 'edit'

  const [role, setRole] = useState<'high_school' | 'university'>(roleParam || 'high_school')
  const [nickname, setNickname] = useState('')
  const [gender, setGender] = useState('回答しない')
  const [schoolName, setSchoolName] = useState('')
  const [grade, setGrade] = useState('')
  const [faculty, setFaculty] = useState('')
  const [year, setYear] = useState('')
  const [homeSchool, setHomeSchool] = useState('')
  const [bio, setBio] = useState('')
  const [notificationHashtags, setNotificationHashtags] = useState<string[]>([])
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
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (existingProfile) {
          setRole(existingProfile.role)
          setNickname(existingProfile.nickname || '')
          setGender(existingProfile.gender || '回答しない')
          setSchoolName(
            existingProfile.role === 'high_school'
              ? existingProfile.school_name || ''
              : existingProfile.university_name || ''
          )
          setGrade(existingProfile.grade || '')
          setFaculty(existingProfile.faculty || '')
          setYear(existingProfile.year || '')
          setHomeSchool(existingProfile.home_school || '')
          setBio(existingProfile.bio || '')
          setNotificationHashtags(existingProfile.notification_hashtags || [])
        } else if (data.user.user_metadata?.role) {
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
      notification_hashtags: !isHighSchool ? notificationHashtags : [],
    }

    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' })

    if (upsertError) {
      setError(upsertError.message)
      setLoading(false)
    } else {
      if (isEditing) {
        router.back()
        return
      }
      router.replace(isHighSchool ? '/student' : '/senpai')
    }
  }

  if (initializing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.scrollview} contentContainerStyle={styles.container}>
      <Text style={styles.title}>{isEditing ? 'プロフィール編集' : 'プロフィール設定'}</Text>
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
          <OptionList options={HIGH_SCHOOL_NAMES} value={schoolName} onChange={setSchoolName} />

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

          <HashtagSelector
            title="通知を受けるハッシュタグ"
            description="興味のある話題の質問が投稿されたときに見つけやすくなります"
            options={HASHTAG_OPTIONS}
            value={notificationHashtags}
            onChange={setNotificationHashtags}
          />
        </>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => (isEditing ? router.back() : router.replace('/'))}
        >
          <Text style={styles.secondaryButtonText}>戻る</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.primaryButtonText}>
              {isEditing ? '変更を保存する' : '登録を完了する'}
            </Text>
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
  scrollview: {
    backgroundColor: '#ffffff',
  },
  container: {
    padding: 24,
    paddingTop: 80,
    backgroundColor: '#ffffff',
    flexGrow: 1,
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
    borderColor: '#FED7AA',
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
    borderColor: '#FED7AA',
  },
  optionItemSelected: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
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
    backgroundColor: '#f97316',
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
    borderColor: '#FED7AA',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#0F172A',
    fontWeight: '700',
  },
})

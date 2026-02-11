import * as Linking from 'expo-linking'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

import { getSupabase } from '@/lib/supabase/client'

export default function SignUpScreen() {
  const router = useRouter()
  const { role: rawRole } = useLocalSearchParams<{ role?: string | string[] }>()
  const role = (Array.isArray(rawRole) ? rawRole[0] : rawRole) as
    | 'high_school'
    | 'university'
    | undefined

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!role) {
    router.replace('/')
    return null
  }

  const isHighSchool = role === 'high_school'

  const handleSubmit = async () => {
    if (!email || !password) return

    setLoading(true)
    setError('')

    const supabase = getSupabase()
    const emailRedirectTo = Linking.createURL('auth/callback', {
      queryParams: { role },
    })

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: { role },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    router.replace(`/auth/sign-up-success?role=${role}`)
    setLoading(false)
  }

  return (
    <View style={[styles.container, { backgroundColor: isHighSchool ? '#2563EB' : '#0EA5E9' }]}>
      <View style={styles.card}>
        <Text style={styles.title}>新規登録</Text>
        <Text style={styles.subtitle}>{isHighSchool ? '高校生' : '大学生'}として登録</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Text style={styles.label}>メールアドレス</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="example@email.com"
        />

        <Text style={styles.label}>パスワード</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="6文字以上"
        />

        <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.primaryButtonText}>登録する</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push(`/auth/login?role=${role}`)}>
          <Text style={styles.linkText}>ログインはこちら</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    color: '#64748B',
    marginBottom: 16,
  },
  label: {
    color: '#0F172A',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  errorText: {
    color: '#EF4444',
    marginBottom: 8,
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
  linkText: {
    marginTop: 12,
    color: '#2563EB',
    textAlign: 'center',
  },
})

import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

import { getSupabase } from '@/lib/supabase/client'

export default function LoginScreen() {
  const router = useRouter()
  const { role: rawRole } = useLocalSearchParams<{ role?: string | string[] }>()
  const role = Array.isArray(rawRole) ? rawRole[0] : rawRole

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!email || !password) return

    setLoading(true)
    setError('')

    const supabase = getSupabase()
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profile) {
        router.replace(profile.role === 'high_school' ? '/student' : '/senpai')
        return
      }

      router.replace(`/profile/setup?role=${role || 'high_school'}`)
    }

    setLoading(false)
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>ログイン</Text>
        <Text style={styles.subtitle}>キャンパス・トークへようこそ</Text>

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
          placeholder="パスワードを入力"
        />

        <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.primaryButtonText}>ログイン</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/')}> 
          <Text style={styles.linkText}>トップページへ戻る</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push(`/auth/sign-up?role=${role || 'high_school'}`)}>
          <Text style={styles.linkText}>新規登録はこちら</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2563EB',
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

import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

import { EulaConsent } from '@/components/ugc/eula-consent'
import { useEulaConsent } from '@/hooks/use-eula-consent'
import { getSupabase } from '@/lib/supabase/client'

export default function LoginScreen() {
  const router = useRouter()
  const { role: rawRole } = useLocalSearchParams<{ role?: string | string[] }>()
  const role = Array.isArray(rawRole) ? rawRole[0] : rawRole
  const isUniversity = role === 'university'
  const isHighSchool = role === 'high_school'
  const universityDomain = 'ed.ritsumei.ac.jp'

  const [email, setEmail] = useState('')
  const [emailLocal, setEmailLocal] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { agreed, setAgreed, validateAgreement } = useEulaConsent(false)

  const handleSubmit = async () => {
    const trimmedLocal = emailLocal.trim()
    const trimmedEmail = email.trim()

    if (isUniversity) {
      if (!trimmedLocal || trimmedLocal.includes('@')) {
        setError('大学のメールアドレスの@より前だけを入力してください')
        return
      }
    } else if (!trimmedEmail) {
      return
    }

    if (!password) return

    const agreementError = validateAgreement()
    if (agreementError) {
      setError(agreementError)
      return
    }

    setLoading(true)
    setError('')

    const loginEmail = isUniversity
      ? `${trimmedLocal}@${universityDomain}`
      : trimmedEmail

    const supabase = getSupabase()
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
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
        <Text style={styles.subtitle}>{isUniversity ? '大学生' : '高校生'}としてログイン</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Text style={styles.label}>メールアドレス</Text>
        {isUniversity ? (
          <View style={styles.emailRow}>
            <TextInput
              style={[styles.input, styles.emailInput]}
              autoCapitalize="none"
              value={emailLocal}
              onChangeText={setEmailLocal}
              placeholder="username"
            />
            <Text style={styles.emailSuffix}>@{universityDomain}</Text>
          </View>
        ) : (
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholder="example@email.com"
          />
        )}

        <Text style={styles.label}>パスワード</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="パスワードを入力"
        />

        <EulaConsent
          agreed={agreed}
          onChange={setAgreed}
          onOpenEula={() =>
            router.push({
              pathname: '/auth/eula/index',
              params: { returnTo: `/auth/login?role=${role || 'high_school'}` },
            })
          }
          helperText="同意しないとログインに進めません。"
        />

        <TouchableOpacity style={[styles.primaryButton, !agreed && styles.primaryButtonDisabled]} onPress={handleSubmit} disabled={loading || !agreed}>
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.primaryButtonText}>ログイン</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/')}> 
          <Text style={styles.linkText}>トップページへ戻る</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace(`/auth/login?role=${isUniversity ? 'high_school' : 'university'}`)}>
          <Text style={styles.linkText}>{isUniversity ? '高校生としてログイン' : '大学生としてログイン'}</Text>
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
    backgroundColor: '#f97316',
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
    borderColor: '#FED7AA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  emailInput: {
    flex: 1,
    marginBottom: 0,
  },
  emailSuffix: {
    marginLeft: 8,
    color: '#0F172A',
  },
  errorText: {
    color: '#EF4444',
    marginBottom: 8,
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
  linkText: {
    marginTop: 12,
    color: '#f97316',
    textAlign: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  highSchoolEmailContainer: {
    marginBottom: 8,
  },
  domainSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  domainOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  domainOptionSelected: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  domainOptionText: {
    fontSize: 12,
    color: '#0F172A',
  },
  domainOptionTextSelected: {
    color: '#ffffff',
  },
})

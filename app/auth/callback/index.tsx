import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'

import { getSupabase } from '@/lib/supabase/client'

export default function AuthCallbackScreen() {
  const router = useRouter()
  const { code, role } = useLocalSearchParams<{ code?: string | string[]; role?: string }>()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      const authCode = Array.isArray(code) ? code[0] : code
      if (!authCode) {
        setError('コードが見つかりません')
        return
      }

      const supabase = getSupabase()
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode)

      if (exchangeError) {
        setError(exchangeError.message)
        return
      }

      router.replace(`/profile/setup?role=${role || 'high_school'}`)
    }

    run()
  }, [code, role, router])

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2563EB" />
      <Text style={styles.text}>認証処理中...</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  text: {
    marginTop: 12,
    color: '#0F172A',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
  },
})

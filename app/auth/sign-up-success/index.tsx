import { useLocalSearchParams, useRouter } from 'expo-router'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export default function SignUpSuccessScreen() {
  const router = useRouter()
  const { role: rawRole } = useLocalSearchParams<{ role?: string | string[] }>()
  const role = Array.isArray(rawRole) ? rawRole[0] : rawRole

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>確認メールを送信しました</Text>
        <Text style={styles.subtitle}>
          ご登録いただいたメールアドレスに確認メールを送信しました。メール内のリンクをクリックして、登録を完了してください。
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace(`/auth/login?role=${role || 'high_school'}`)}
        >
          <Text style={styles.primaryButtonText}>ログインページへ</Text>
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
    marginBottom: 12,
  },
  subtitle: {
    color: '#64748B',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
})

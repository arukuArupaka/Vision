import { useRouter } from 'expo-router'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export default function AuthErrorScreen() {
  const router = useRouter()

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>エラーが発生しました</Text>
        <Text style={styles.subtitle}>
          認証処理中にエラーが発生しました。お手数ですが、もう一度お試しください。
        </Text>

        <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/')}
        >
          <Text style={styles.primaryButtonText}>トップページへ戻る</Text>
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
    marginBottom: 12,
  },
  subtitle: {
    color: '#64748B',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#f97316',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
})

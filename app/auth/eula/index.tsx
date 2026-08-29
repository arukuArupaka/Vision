import { useLocalSearchParams, useRouter } from 'expo-router'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function EULAScreen() {
  const router = useRouter()
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>()

  const handleAccept = () => {
    if (returnTo) {
      router.replace(returnTo)
      return
    }

    router.back()
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>戻る</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>利用規約（EULA）</Text>
        <Text style={styles.subtitle}>キャンパス・トーク利用規約</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第1条（適用）</Text>
          <Text style={styles.paragraph}>
            本利用規約は、当サービスの利用に関する条件を定めるものです。高校生・大学生の利用者は、
            本利用規約に同意したうえでサービスを利用するものとします。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第2条（守るべきこと）</Text>
          <Text style={styles.paragraph}>
            利用者は、他者への誹謗中傷、過度な攻撃、個人情報の公開、虚偽の情報提供、違法行為、
            迷惑行為、性的・暴力的・危険な表現の投稿を行ってはなりません。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第3条（通報・ブロック・監視）</Text>
          <Text style={styles.paragraph}>
            当サービスは、利用者からの通報やブロックの申請を受け、必要に応じて投稿の削除、
            アカウントの一時停止または停止を行うことがあります。重大な違反が確認された場合は、
            開発者が速やかに対応し、24時間以内の対応を目指します。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第4条（禁止事項）</Text>
          <Text style={styles.paragraph}>
            いかなる場合も、サービスを利用して他者の信用や安全を害する行為、法令違反、
            スパム、詐欺、スカミング、心理的被害につながる行為は禁止します。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第5条（利用停止）</Text>
          <Text style={styles.paragraph}>
            当サービスは、利用者が本規約に違反した場合、通報件数やブロック件数の多さなどをもとに、
            投稿の非表示、メッセージの停止、アカウント停止、削除などの措置を行う場合があります。
          </Text>
        </View>

        <View style={styles.noticeBox}>
          <Text style={styles.noticeTitle}>重要なお知らせ</Text>
          <Text style={styles.paragraph}>
            本サービスは高校生と大学生が安心して相談し、質問に答えるための場です。
            利用者は、相手の立場や個人情報に配慮し、誠実かつ公正に利用してください。
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleAccept}>
          <Text style={styles.primaryButtonText}>同意して次へ</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFF7ED',
  },
  backText: {
    color: '#7c2d12',
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: -8,
  },
  section: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: '#334155',
  },
  noticeBox: {
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: 16,
    gap: 8,
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#7c2d12',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  primaryButton: {
    backgroundColor: '#f97316',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
})

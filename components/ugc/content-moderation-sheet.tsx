import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import type { ModerationMode, ModerationReason, ModerationTarget } from '@/hooks/use-content-moderation'

type ContentModerationSheetProps = {
  visible: boolean
  mode: ModerationMode | null
  target: ModerationTarget | null
  reportReasons: ModerationReason[]
  submitting?: boolean
  onClose: () => void
  onSelectReason: (reason: string) => void
  onConfirmBlock: () => void
}

export function ContentModerationSheet({
  visible,
  mode,
  target,
  reportReasons,
  submitting,
  onClose,
  onSelectReason,
  onConfirmBlock,
}: ContentModerationSheetProps) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{mode === 'block' ? 'ブロックの確認' : '通報する理由を選択'}</Text>
          <Text style={styles.subtitle}>
            {target?.targetLabel ? `${target.targetLabel} に対する操作です` : '対象の投稿またはユーザーを選択してください'}
          </Text>

          {mode === 'report' ? (
            <View style={styles.reasonList}>
              {reportReasons.map((reason) => (
                <TouchableOpacity
                  key={reason.value}
                  style={styles.reasonButton}
                  onPress={() => onSelectReason(reason.value)}
                  disabled={submitting}
                >
                  <Text style={styles.reasonButtonText}>{reason.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          {mode === 'block' ? (
            <View style={styles.blockPanel}>
              <Text style={styles.blockText}>
                このユーザーをブロックすると、今表示しているフィードから即時に非表示にできます。
              </Text>
              <TouchableOpacity
                style={[styles.destructiveButton, submitting && styles.disabledButton]}
                onPress={onConfirmBlock}
                disabled={submitting}
              >
                <Text style={styles.destructiveButtonText}>
                  {submitting ? '処理中...' : 'このユーザーをブロックする'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={submitting}>
            <Text style={styles.cancelButtonText}>キャンセル</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  reasonList: {
    gap: 10,
  },
  reasonButton: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFF7ED',
  },
  reasonButtonText: {
    color: '#7c2d12',
    fontWeight: '600',
  },
  blockPanel: {
    gap: 12,
  },
  blockText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#334155',
  },
  destructiveButton: {
    backgroundColor: '#dc2626',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  destructiveButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: '#475569',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
})

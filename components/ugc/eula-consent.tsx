import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

type EulaConsentProps = {
  agreed: boolean
  onChange: (nextValue: boolean) => void
  onOpenEula: () => void
  helperText?: string
}

export function EulaConsent({ agreed, onChange, onOpenEula, helperText }: EulaConsentProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => onChange(!agreed)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: agreed }}
      >
        <View style={[styles.checkbox, agreed && styles.checkboxChecked]} />
        <Text style={styles.label}>利用規約に同意する</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onOpenEula} accessibilityRole="link">
        <Text style={styles.linkText}>利用規約（EULA）を見る</Text>
      </TouchableOpacity>

      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    marginRight: 8,
    backgroundColor: '#ffffff',
  },
  checkboxChecked: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  label: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  linkText: {
    color: '#f97316',
    fontSize: 13,
    fontWeight: '700',
  },
  helperText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
})

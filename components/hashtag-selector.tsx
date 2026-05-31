import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

type HashtagSelectorProps = {
  title: string
  description: string
  options: string[]
  value: string[]
  onChange: (next: string[]) => void
}

export function HashtagSelector({ title, description, options, value, onChange }: HashtagSelectorProps) {
  const toggleOption = (option: string) => {
    const next = value.includes(option)
      ? value.filter((item) => item !== option)
      : [...value, option]

    onChange(next)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      <View style={styles.optionList}>
        {options.map((option) => {
          const selected = value.includes(option)
          return (
            <TouchableOpacity
              key={option}
              style={[styles.optionItem, selected && styles.optionItemSelected]}
              onPress={() => toggleOption(option)}
            >
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                #{option}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  title: {
    color: '#0F172A',
    marginBottom: 4,
    fontWeight: '600',
  },
  description: {
    color: '#64748B',
    marginBottom: 8,
    fontSize: 12,
  },
  optionList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionItem: {
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FED7AA',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
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
    fontWeight: '600',
  },
})

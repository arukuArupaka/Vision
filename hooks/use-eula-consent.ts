import { useMemo, useState } from 'react'

export const useEulaConsent = (initialValue = false) => {
  const [agreed, setAgreed] = useState(initialValue)

  const toggleAgreement = () => {
    setAgreed((current) => !current)
  }

  const canProceed = useMemo(() => agreed, [agreed])

  const validateAgreement = () => {
    if (!agreed) {
      return '利用規約に同意してください'
    }

    return null
  }

  return {
    agreed,
    setAgreed,
    toggleAgreement,
    canProceed,
    validateAgreement,
  }
}

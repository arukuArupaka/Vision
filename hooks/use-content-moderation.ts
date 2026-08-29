import { useMemo, useState } from 'react'

export type ModerationMode = 'report' | 'block'

export type ModerationTarget = {
  targetId?: string
  targetUserId: string
  targetLabel: string
  contentPreview?: string
  reportType: string
}

export type ModerationReason = {
  label: string
  value: string
}

export const DEFAULT_REPORT_REASONS: ModerationReason[] = [
  { label: 'スパム・宣伝', value: 'spam' },
  { label: '嫌がらせ・暴言', value: 'harassment' },
  { label: '個人情報の公開', value: 'privacy' },
  { label: '不適切な内容', value: 'inappropriate' },
  { label: 'その他', value: 'other' },
]

const mockModerationRequest = <T,>(payload: T) => {
  return new Promise<{ ok: boolean; payload: T }>((resolve) => {
    setTimeout(() => {
      resolve({ ok: true, payload })
    }, 650)
  })
}

type UseContentModerationOptions = {
  currentUserId?: string
  onBlocked?: (blockedUserId: string) => void
  onReported?: (payload: { target: ModerationTarget; reason: string }) => void
}

export const useContentModeration = ({
  currentUserId,
  onBlocked,
  onReported,
}: UseContentModerationOptions) => {
  const [mode, setMode] = useState<ModerationMode | null>(null)
  const [target, setTarget] = useState<ModerationTarget | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const isVisible = Boolean(mode && target)

  const reportReasons = useMemo(() => DEFAULT_REPORT_REASONS, [])

  const openReport = (nextTarget: ModerationTarget) => {
    if (!currentUserId) return
    setTarget(nextTarget)
    setMode('report')
  }

  const openBlock = (nextTarget: ModerationTarget) => {
    if (!currentUserId) return
    setTarget(nextTarget)
    setMode('block')
  }

  const close = () => {
    if (submitting) return
    setMode(null)
    setTarget(null)
  }

  const submitReport = async (reason: string) => {
    if (!currentUserId || !target || !reason.trim()) return false

    setSubmitting(true)
    const result = await mockModerationRequest({
      action: 'report',
      reporterId: currentUserId,
      reportedUserId: target.targetUserId,
      targetId: target.targetId ?? null,
      reason: reason.trim(),
      reportType: target.reportType,
      contentPreview: target.contentPreview ?? null,
    })

    setSubmitting(false)

    if (result.ok) {
      onReported?.({ target, reason: reason.trim() })
      close()
      return true
    }

    return false
  }

  const submitBlock = async () => {
    if (!currentUserId || !target) return false

    setSubmitting(true)
    const result = await mockModerationRequest({
      action: 'block',
      blockerId: currentUserId,
      blockedUserId: target.targetUserId,
      targetId: target.targetId ?? null,
      reportType: target.reportType,
    })

    setSubmitting(false)

    if (result.ok) {
      onBlocked?.(target.targetUserId)
      close()
      return true
    }

    return false
  }

  return {
    isVisible,
    mode,
    target,
    reportReasons,
    submitting,
    openReport,
    openBlock,
    close,
    submitReport,
    submitBlock,
  }
}

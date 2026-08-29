import type { SupabaseClient } from '@supabase/supabase-js'

export const MODERATION_KEYWORDS = [
  'セックス',
  'エロ',
  '出会い',
  '裸',
  '成人向け',
  'ギャンブル',
  '詐欺',
  '投資詐欺',
  '自傷',
  '暴力',
  '殺人',
  '薬物',
  '違法',
  'spam',
  'scam',
  'violence',
  'attack',
]

export const containsInappropriateContent = (text: string) => {
  if (!text) return false

  const normalized = text.replace(/\s+/g, '').toLowerCase()
  return MODERATION_KEYWORDS.some((keyword) => normalized.includes(keyword.toLowerCase()))
}

export const getBlockedUserIds = async (
  supabase: SupabaseClient,
  userId?: string | null
): Promise<Set<string>> => {
  if (!userId) return new Set()

  try {
    const { data, error } = await supabase
      .from('blocks')
      .select('blocked_id')
      .eq('blocker_id', userId)

    if (error) {
      console.warn('[moderation] failed to load blocks', error.message)
      return new Set()
    }

    return new Set(
      (data || [])
        .map((row: { blocked_id?: string | null }) => row.blocked_id)
        .filter((id): id is string => Boolean(id))
    )
  } catch (error) {
    console.warn('[moderation] unexpected block fetch error', error)
    return new Set()
  }
}

export const blockUser = async ({
  supabase,
  blockerId,
  blockedId,
}: {
  supabase: SupabaseClient
  blockerId: string
  blockedId: string
}) => {
  if (!blockerId || !blockedId || blockerId === blockedId) {
    return false
  }

  try {
    const { error } = await supabase.from('blocks').insert({
      blocker_id: blockerId,
      blocked_id: blockedId,
    })

    if (error) {
      console.warn('[moderation] block insert failed', error.message)
      return false
    }

    const { count, error: countError } = await supabase
      .from('blocks')
      .select('id', { count: 'exact', head: true })
      .eq('blocked_id', blockedId)

    if (!countError && typeof count === 'number' && count >= 5) {
      const autoSuspendError = await supabase
        .from('profiles')
        .update({
          is_suspended: true,
          suspended_at: new Date().toISOString(),
          deleted_at: new Date().toISOString(),
        })
        .eq('id', blockedId)

      if (!autoSuspendError.error) {
        await supabase.from('reports').insert({
          reporter_id: blockerId,
          reported_id: blockedId,
          reason: '自動モデレーション: 5件以上のブロックによりアカウントを停止',
        })
      } else {
        console.warn('[moderation] auto suspend failed', autoSuspendError.error.message)
      }
    }

    console.warn('[moderation] user blocked', { blockerId, blockedId })
    return true
  } catch (error) {
    console.warn('[moderation] block error', error)
    return false
  }
}

export const reportContent = async ({
  supabase,
  reporterId,
  reportedUserId,
  reportType,
  targetId,
  reason,
  contentPreview,
}: {
  supabase: SupabaseClient
  reporterId: string
  reportedUserId: string
  reportType: string
  targetId?: string | null
  reason: string
  contentPreview?: string | null
}) => {
  const trimmedReason = reason.trim()

  if (!reporterId || !reportedUserId || !trimmedReason) {
    return false
  }

  const details = [
    `type=${reportType}`,
    targetId ? `target=${targetId}` : null,
    contentPreview ? `preview=${contentPreview.slice(0, 120)}` : null,
    `reason=${trimmedReason}`,
  ]
    .filter(Boolean)
    .join(' | ')

  try {
    const { error } = await supabase.from('reports').insert({
      reporter_id: reporterId,
      reported_id: reportedUserId,
      reason: details,
    })

    if (error) {
      console.warn('[moderation] report insert failed', error.message)
      return false
    }

    console.warn('[moderation] report submitted', {
      reporterId,
      reportedUserId,
      reportType,
      targetId,
      reason: trimmedReason,
    })
    return true
  } catch (error) {
    console.warn('[moderation] report error', error)
    return false
  }
}

export const filterBlockedUserItems = <T extends { user_id?: string; sender_id?: string }>(
  items: T[],
  blockedIds: Set<string>
) => items.filter((item) => {
  const userId = item.user_id || item.sender_id
  return !userId || !blockedIds.has(userId)
})

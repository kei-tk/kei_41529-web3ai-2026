// 表示用フォーマッタ。

export function formatSize(kb: number): string {
  if (kb >= 1024 * 1024) return `${(kb / 1024 / 1024).toFixed(1)} GB`
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`
  return `${kb} KB`
}

export function formatDate(ms: number): string {
  const d = new Date(ms)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

// 「3日前」のような相対表記
export function relativeDate(ms: number): string {
  const diff = Date.now() - ms
  const day = 86400000
  const days = Math.floor(diff / day)
  if (days <= 0) return '今日'
  if (days === 1) return '昨日'
  if (days < 30) return `${days}日前`
  if (days < 365) return `${Math.floor(days / 30)}ヶ月前`
  return `${Math.floor(days / 365)}年前`
}

// 日付の粗いグルーピング(サイドバーの期間フィルタ用)
export type DateBucket = 'all' | 'week' | 'month' | 'older'
export function dateBucket(ms: number): Exclude<DateBucket, 'all'> {
  const days = (Date.now() - ms) / 86400000
  if (days <= 7) return 'week'
  if (days <= 31) return 'month'
  return 'older'
}

import type { CategoryId } from '../types'

// カテゴリ(=棚)の定義。色は Tailwind の塗り分けに使う。
export interface CategoryDef {
  id: CategoryId
  label: string
  emoji: string
  // バッジ・アクセント用の色クラス
  text: string
  bg: string
  ring: string
  dot: string
}

export const CATEGORIES: CategoryDef[] = [
  { id: 'lecture', label: '講義資料', emoji: '📚', text: 'text-indigo-700', bg: 'bg-indigo-50', ring: 'ring-indigo-200', dot: 'bg-indigo-500' },
  { id: 'assignment', label: '課題・宿題', emoji: '📝', text: 'text-rose-700', bg: 'bg-rose-50', ring: 'ring-rose-200', dot: 'bg-rose-500' },
  { id: 'report', label: 'レポート・書類', emoji: '📄', text: 'text-sky-700', bg: 'bg-sky-50', ring: 'ring-sky-200', dot: 'bg-sky-500' },
  { id: 'code', label: 'コード', emoji: '💻', text: 'text-emerald-700', bg: 'bg-emerald-50', ring: 'ring-emerald-200', dot: 'bg-emerald-500' },
  { id: 'image', label: '画像・スクショ', emoji: '🖼️', text: 'text-amber-700', bg: 'bg-amber-50', ring: 'ring-amber-200', dot: 'bg-amber-500' },
  { id: 'media', label: '動画・音声', emoji: '🎬', text: 'text-fuchsia-700', bg: 'bg-fuchsia-50', ring: 'ring-fuchsia-200', dot: 'bg-fuchsia-500' },
  { id: 'finance', label: '領収書・お金', emoji: '🧾', text: 'text-teal-700', bg: 'bg-teal-50', ring: 'ring-teal-200', dot: 'bg-teal-500' },
  { id: 'archive', label: '圧縮ファイル', emoji: '🗜️', text: 'text-stone-700', bg: 'bg-stone-100', ring: 'ring-stone-300', dot: 'bg-stone-500' },
  { id: 'other', label: 'その他', emoji: '📦', text: 'text-slate-600', bg: 'bg-slate-100', ring: 'ring-slate-300', dot: 'bg-slate-400' },
]

export const CATEGORY_MAP: Record<CategoryId, CategoryDef> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<CategoryId, CategoryDef>

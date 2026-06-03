import type { CategoryId } from '../types'
import type { DateBucket } from '../lib/format'
import { CATEGORIES } from '../lib/categories'
import Logo from './Logo'

export interface SidebarProps {
  total: number
  categoryCounts: Record<CategoryId, number>
  subjects: { name: string; count: number }[]
  tags: { name: string; count: number }[]
  activeCategory: CategoryId | 'all'
  activeSubject: string | 'all'
  activeDate: DateBucket
  activeTag: string | null
  setActiveCategory: (c: CategoryId | 'all') => void
  setActiveSubject: (s: string | 'all') => void
  setActiveDate: (d: DateBucket) => void
  setActiveTag: (t: string | null) => void
  onLoadDemo: () => void
  onAddFiles: () => void
  onAddFolder: () => void
}

const DATE_OPTIONS: { id: DateBucket; label: string }[] = [
  { id: 'all', label: 'すべて' },
  { id: 'week', label: '今週' },
  { id: 'month', label: '今月' },
  { id: 'older', label: 'それ以前' },
]

export default function Sidebar(props: SidebarProps) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r border-stone-200/70 bg-washi-deep/40 p-5">
      <Logo />

      <div className="flex flex-col gap-2">
        <button
          onClick={props.onAddFolder}
          className="rounded-xl bg-ink px-3 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-stone-700"
        >
          📁 フォルダごと読み込む
        </button>
        <button
          onClick={props.onAddFiles}
          className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-bold text-stone-600 transition hover:border-stone-400 hover:text-ink"
        >
          ＋ ファイルを選んで追加
        </button>
        <button
          onClick={props.onLoadDemo}
          className="rounded-xl px-3 py-1.5 text-xs font-bold text-stone-400 transition hover:text-stone-600"
        >
          🗂️ デモ(散らかったDL)を見る
        </button>
      </div>

      {/* 棚(カテゴリ) */}
      <Section title="棚で絞る">
        <FilterRow
          label="すべての棚"
          emoji="🗄️"
          count={props.total}
          active={props.activeCategory === 'all'}
          onClick={() => props.setActiveCategory('all')}
        />
        {CATEGORIES.map((c) => {
          const count = props.categoryCounts[c.id] ?? 0
          if (count === 0) return null
          return (
            <FilterRow
              key={c.id}
              label={c.label}
              emoji={c.emoji}
              count={count}
              active={props.activeCategory === c.id}
              onClick={() => props.setActiveCategory(c.id)}
            />
          )
        })}
      </Section>

      {/* 科目 */}
      {props.subjects.length > 0 && (
        <Section title="科目で絞る">
          <FilterRow
            label="すべて"
            count={props.subjects.reduce((s, x) => s + x.count, 0)}
            active={props.activeSubject === 'all'}
            onClick={() => props.setActiveSubject('all')}
          />
          {props.subjects.map((s) => (
            <FilterRow
              key={s.name}
              label={s.name}
              count={s.count}
              active={props.activeSubject === s.name}
              onClick={() => props.setActiveSubject(s.name)}
            />
          ))}
        </Section>
      )}

      {/* 期間 */}
      <Section title="いつDLした?">
        <div className="flex flex-wrap gap-1.5">
          {DATE_OPTIONS.map((d) => (
            <button
              key={d.id}
              onClick={() => props.setActiveDate(d.id)}
              className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                props.activeDate === d.id ? 'bg-ink text-white' : 'bg-white text-stone-500 ring-1 ring-stone-200 hover:text-ink'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </Section>

      {/* タグクラウド */}
      {props.tags.length > 0 && (
        <Section title="タグ">
          <div className="flex flex-wrap gap-1.5">
            {props.tags.map((t) => (
              <button
                key={t.name}
                onClick={() => props.setActiveTag(props.activeTag === t.name ? null : t.name)}
                className={`rounded-md px-2 py-0.5 text-xs font-medium transition ${
                  props.activeTag === t.name
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white text-stone-500 ring-1 ring-stone-200 hover:text-ink'
                }`}
              >
                #{t.name}
              </button>
            ))}
          </div>
        </Section>
      )}
    </aside>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-[11px] font-black uppercase tracking-wider text-stone-400">{title}</h3>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  )
}

function FilterRow({
  label,
  emoji,
  count,
  active,
  onClick,
}: {
  label: string
  emoji?: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm transition ${
        active ? 'bg-white font-bold text-ink shadow-sm ring-1 ring-stone-200' : 'text-stone-600 hover:bg-white/60'
      }`}
    >
      <span className="flex items-center gap-2 truncate">
        {emoji && <span className="text-base">{emoji}</span>}
        <span className="truncate">{label}</span>
      </span>
      <span className={`ml-2 shrink-0 rounded-full px-1.5 text-[11px] tabular-nums ${active ? 'bg-stone-100 text-stone-500' : 'text-stone-400'}`}>
        {count}
      </span>
    </button>
  )
}

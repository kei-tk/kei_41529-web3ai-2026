// AIがファイルの中身を読んで分類している最中の演出。
// VPC で一番伝えたい「DLした瞬間にAIが中身を読む」を可視化する。
export interface IngestState {
  total: number
  done: number
  currentName: string
}

export default function IngestOverlay({
  state,
  title = 'AIが中身を読んでいます…',
  subtitle = '名前・本文・拡張子から棚を判定中',
  icon = '🗄️',
}: {
  state: IngestState
  title?: string
  subtitle?: string
  icon?: string
}) {
  const pct = Math.round((state.done / Math.max(1, state.total)) * 100)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm">
      <div className="w-[min(440px,90vw)] rounded-3xl bg-white p-8 shadow-2xl ring-1 ring-black/5">
        <div className="mb-5 flex items-center gap-3">
          <div className="relative grid h-12 w-12 place-items-center overflow-hidden rounded-2xl bg-ink">
            <span className="text-2xl">{icon}</span>
            {/* スキャンライン */}
            <span className="animate-scan pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-emerald-300/0 via-emerald-300/70 to-emerald-300/0" />
          </div>
          <div>
            <div className="font-display text-lg font-black">{title}</div>
            <div className="text-xs text-stone-500">{subtitle}</div>
          </div>
        </div>

        <div className="mb-2 flex items-center justify-between text-xs font-bold text-stone-500">
          <span className="truncate pr-3 font-mono text-stone-700">{state.currentName}</span>
          <span className="tabular-nums">{state.done}/{state.total}</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-200"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  )
}

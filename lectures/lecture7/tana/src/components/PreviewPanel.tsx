import type { OrgFile } from '../types'
import { CATEGORY_MAP } from '../lib/categories'
import { formatSize, formatDate } from '../lib/format'

// ファイルの中身プレビュー(VPC の Gain「中身プレビューで一覧」)。
// 右からスライドインするパネル。テキストは本文、それ以外はメタ情報を表示。
export default function PreviewPanel({ file, onClose }: { file: OrgFile; onClose: () => void }) {
  const cat = CATEGORY_MAP[file.category]
  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]" onClick={onClose} />
      <aside className="animate-slot relative flex h-full w-[min(460px,92vw)] flex-col bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-stone-100 p-5">
          <div className="flex items-center gap-3">
            <div className={`grid h-12 w-12 place-items-center rounded-2xl text-2xl ${cat.bg} ring-1 ${cat.ring}`}>
              {cat.emoji}
            </div>
            <div className="min-w-0">
              <div className="break-all text-sm font-black leading-snug text-ink">{file.name}</div>
              <div className="mt-0.5 text-xs text-stone-400">
                {file.ext.toUpperCase()} · {formatSize(file.sizeKB)} · {formatDate(file.modified)}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-stone-400 transition hover:bg-stone-100 hover:text-ink"
            aria-label="閉じる"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {/* AI の判定 */}
          <section className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-4 ring-1 ring-emerald-100">
            <div className="mb-2 flex items-center justify-between text-xs font-black text-emerald-700">
              <span className="flex items-center gap-1.5">
                <span>✨</span> AIの判定
              </span>
              <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] text-stone-500">
                {file.engine === 'llm' ? '🤖 Gemini' : '📖 ルールベース'}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-stone-700">{file.summary}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[11px] font-bold text-stone-400">確信度</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/70">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${file.confidence}%` }} />
              </div>
              <span className="text-[11px] font-bold tabular-nums text-emerald-700">{file.confidence}%</span>
            </div>
          </section>

          <Meta label="しまった棚">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${cat.bg} ${cat.text}`}>
              {cat.emoji} {cat.label}
            </span>
          </Meta>

          {file.subject && (
            <Meta label="科目">
              <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700">{file.subject}</span>
            </Meta>
          )}

          {file.tags.length > 0 && (
            <Meta label="タグ">
              <div className="flex flex-wrap gap-1.5">
                {file.tags.map((t) => (
                  <span key={t} className="rounded-md bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                    #{t}
                  </span>
                ))}
              </div>
            </Meta>
          )}

          {/* 中身プレビュー */}
          <Meta label="中身プレビュー">
            {file.textContent ? (
              <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-stone-50 p-3 font-mono text-xs leading-relaxed text-stone-600 ring-1 ring-stone-100">
                {file.textContent}
              </pre>
            ) : (
              <div className="rounded-xl bg-stone-50 p-6 text-center text-xs text-stone-400 ring-1 ring-stone-100">
                {file.category === 'image' ? '🖼️ 画像ファイル' : file.category === 'media' ? '🎬 メディアファイル' : '📦 バイナリファイル'}
                <br />
                テキストの中身プレビューはありません
              </div>
            )}
          </Meta>
        </div>
      </aside>
    </div>
  )
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-400">{label}</div>
      {children}
    </section>
  )
}

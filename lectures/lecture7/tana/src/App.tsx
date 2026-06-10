import { useMemo, useRef, useState } from 'react'
import type { CategoryId, OrgFile } from './types'
import { CATEGORIES } from './lib/categories'
import { dateBucket, type DateBucket } from './lib/format'
import { buildDemoFiles, ingestRealFiles } from './lib/ingest'
import { classifyWithGemini, getApiKey, getModel, setApiKey, setModel } from './lib/llm'
import Sidebar from './components/Sidebar'
import FileCard from './components/FileCard'
import PreviewPanel from './components/PreviewPanel'
import SettingsModal from './components/SettingsModal'
import IngestOverlay, { type IngestState } from './components/IngestOverlay'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
type SortKey = 'date' | 'name' | 'size'

export default function App() {
  const [files, setFiles] = useState<OrgFile[]>([])
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<CategoryId | 'all'>('all')
  const [activeSubject, setActiveSubject] = useState<string | 'all'>('all')
  const [activeDate, setActiveDate] = useState<DateBucket>('all')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [sort, setSort] = useState<SortKey>('date')
  const [selected, setSelected] = useState<OrgFile | null>(null)
  const [ingest, setIngest] = useState<IngestState | null>(null)
  const [refining, setRefining] = useState<IngestState | null>(null)
  const [dragOver, setDragOver] = useState(false)
  // v3: Gemini(本物のLLM)モード
  const [hasKey, setHasKey] = useState<boolean>(() => !!getApiKey())
  const [showSettings, setShowSettings] = useState(false)
  const [llmError, setLlmError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  // ── AIが順番に読み込む演出 → 完了後に棚へ収める ──
  async function runIngest(incoming: OrgFile[], replace: boolean) {
    if (incoming.length === 0) return
    // 件数が多くても全体が間延びしないよう、1件あたりの待ちを総時間で調整
    const per = Math.max(8, Math.min(90, Math.round(1800 / incoming.length)))
    setIngest({ total: incoming.length, done: 0, currentName: incoming[0].name })
    for (let i = 0; i < incoming.length; i++) {
      await sleep(per)
      setIngest({ total: incoming.length, done: i + 1, currentName: incoming[i].name })
    }
    await sleep(280)
    setFiles((prev) => (replace ? incoming : [...incoming, ...prev]))
    setIngest(null)
    // v3: キーがあれば本物のLLM(Gemini)で精査して上書き
    await refineWithLLM(incoming)
  }

  // ── v3: Gemini で中身を意味理解して再分類 ──
  async function refineWithLLM(targets: OrgFile[]) {
    const key = getApiKey()
    if (!key || targets.length === 0) return
    const model = getModel()
    setLlmError(null)
    setRefining({ total: targets.length, done: 0, currentName: model })
    try {
      const inputs = targets.map((f, i) => ({ index: i, name: f.name, ext: f.ext, content: f.textContent }))
      const map = await classifyWithGemini(inputs, key, model, (done, total) =>
        setRefining({ total, done, currentName: model }),
      )
      setFiles((prev) =>
        prev.map((f) => {
          const idx = targets.findIndex((t) => t.id === f.id)
          if (idx < 0) return f
          const r = map.get(idx)
          return r ? { ...f, ...r, engine: 'llm' as const } : f
        }),
      )
    } catch (e) {
      setLlmError(e instanceof Error ? e.message : String(e))
    } finally {
      setRefining(null)
    }
  }

  const onSaveSettings = (key: string, model: string) => {
    setApiKey(key)
    setModel(model)
    setHasKey(!!key)
    setShowSettings(false)
    // 既に表示中のファイルがあれば、新しい設定で再分類
    if (key && files.length > 0) refineWithLLM(files)
  }

  const loadDemo = () => runIngest(buildDemoFiles(), true)

  const onAddFiles = () => fileInputRef.current?.click()
  const onAddFolder = () => folderInputRef.current?.click()
  // replace=true: フォルダごと読み込み(今の表示を置き換え) / false: 個別追加
  const handleFiles = async (list: FileList | null, replace: boolean) => {
    if (!list || list.length === 0) return
    const org = await ingestRealFiles(list)
    await runIngest(org, replace)
  }

  // ── 集計(サイドバーのカウント類) ──
  const categoryCounts = useMemo(() => {
    const c = Object.fromEntries(CATEGORIES.map((x) => [x.id, 0])) as Record<CategoryId, number>
    for (const f of files) c[f.category]++
    return c
  }, [files])

  const subjects = useMemo(() => {
    const m = new Map<string, number>()
    for (const f of files) if (f.subject) m.set(f.subject, (m.get(f.subject) ?? 0) + 1)
    return Array.from(m, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
  }, [files])

  const tags = useMemo(() => {
    const m = new Map<string, number>()
    for (const f of files) for (const t of f.tags) m.set(t, (m.get(t) ?? 0) + 1)
    return Array.from(m, ([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 14)
  }, [files])

  // ── フィルタ + 検索 + 並び替え ──
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const out = files.filter((f) => {
      if (activeCategory !== 'all' && f.category !== activeCategory) return false
      if (activeSubject !== 'all' && f.subject !== activeSubject) return false
      if (activeDate !== 'all' && dateBucket(f.modified) !== activeDate) return false
      if (activeTag && !f.tags.includes(activeTag)) return false
      if (q) {
        const hay = `${f.name} ${f.summary} ${f.subject ?? ''} ${f.tags.join(' ')} ${f.textContent ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
    out.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name, 'ja')
      if (sort === 'size') return b.sizeKB - a.sizeKB
      return b.modified - a.modified
    })
    return out
  }, [files, query, activeCategory, activeSubject, activeDate, activeTag, sort])

  const hasFilter = activeCategory !== 'all' || activeSubject !== 'all' || activeDate !== 'all' || activeTag !== null || query.trim() !== ''
  const grouped = activeCategory === 'all' && sort === 'date'

  // カテゴリごとにまとめた表示用データ
  const groups = useMemo(() => {
    if (!grouped) return null
    return CATEGORIES.map((c) => ({ cat: c, items: filtered.filter((f) => f.category === c.id) })).filter(
      (g) => g.items.length > 0,
    )
  }, [grouped, filtered])

  const resetFilters = () => {
    setActiveCategory('all')
    setActiveSubject('all')
    setActiveDate('all')
    setActiveTag(null)
    setQuery('')
  }

  return (
    <div
      className="flex h-screen w-screen overflow-hidden bg-washi"
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        handleFiles(e.dataTransfer.files, false)
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files, false)
          e.target.value = ''
        }}
      />
      {/* フォルダごと選択(webkitdirectory)。中身を置き換える。 */}
      <input
        ref={folderInputRef}
        type="file"
        {...({ webkitdirectory: '', directory: '' } as Record<string, string>)}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files, true)
          e.target.value = ''
        }}
      />

      <Sidebar
        total={files.length}
        categoryCounts={categoryCounts}
        subjects={subjects}
        tags={tags}
        activeCategory={activeCategory}
        activeSubject={activeSubject}
        activeDate={activeDate}
        activeTag={activeTag}
        setActiveCategory={setActiveCategory}
        setActiveSubject={setActiveSubject}
        setActiveDate={setActiveDate}
        setActiveTag={setActiveTag}
        onLoadDemo={loadDemo}
        onAddFiles={onAddFiles}
        onAddFolder={onAddFolder}
      />

      <main className="flex flex-1 flex-col overflow-hidden">
        {/* トップバー:検索・並び替え・整理メーター */}
        <header className="flex items-center gap-3 border-b border-stone-200/70 bg-washi/80 px-6 py-3 backdrop-blur">
          <div className="relative flex-1 max-w-lg">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">🔍</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ファイル名・中身・タグを横断検索…"
              className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-600 outline-none"
          >
            <option value="date">新しい順</option>
            <option value="name">名前順</option>
            <option value="size">サイズ順</option>
          </select>

          <div className="ml-auto flex items-center gap-2">
            {files.length > 0 && (
              <div className="hidden items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100 lg:flex">
                ✅ {files.length}件を{Object.values(categoryCounts).filter((n) => n > 0).length}つの棚に整理
              </div>
            )}
            {/* v3: 分類エンジンの表示。クリックで設定 */}
            <button
              onClick={() => setShowSettings(true)}
              title="AIモード設定"
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold ring-1 transition ${
                hasKey
                  ? 'bg-indigo-50 text-indigo-700 ring-indigo-200 hover:bg-indigo-100'
                  : 'bg-white text-stone-500 ring-stone-200 hover:text-ink'
              }`}
            >
              {hasKey ? '🤖 Geminiモード' : '📖 ルールベース'}
              <span className="text-stone-400">⚙︎</span>
            </button>
          </div>
        </header>

        {/* v3: LLM エラー通知 */}
        {llmError && (
          <div className="flex items-center justify-between gap-3 border-b border-rose-100 bg-rose-50 px-6 py-2 text-xs text-rose-700">
            <span className="truncate">⚠️ Gemini分類に失敗(ルールベースのまま表示中): {llmError}</span>
            <button onClick={() => setLlmError(null)} className="shrink-0 font-bold hover:underline">
              閉じる
            </button>
          </div>
        )}

        {/* 本体 */}
        <div className="relative flex-1 overflow-y-auto px-6 py-5">
          {files.length === 0 ? (
            <EmptyState onLoadDemo={loadDemo} />
          ) : filtered.length === 0 ? (
            <div className="grid h-full place-items-center text-center text-stone-400">
              <div>
                <div className="mb-2 text-4xl">🔍</div>
                <p className="text-sm">条件に合うファイルがありません</p>
                <button onClick={resetFilters} className="mt-3 text-sm font-bold text-emerald-600 hover:underline">
                  フィルタをリセット
                </button>
              </div>
            </div>
          ) : (
            <>
              {hasFilter && (
                <div className="mb-4 flex items-center gap-2 text-sm text-stone-500">
                  <span className="font-bold text-ink">{filtered.length}件</span>
                  <span>該当</span>
                  <button onClick={resetFilters} className="ml-1 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-bold text-stone-500 hover:bg-stone-200">
                    クリア ✕
                  </button>
                </div>
              )}

              {groups ? (
                <div className="space-y-7">
                  {groups.map((g) => (
                    <section key={g.cat.id}>
                      <div className="mb-3 flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-black ${g.cat.bg} ${g.cat.text}`}>
                          <span>{g.cat.emoji}</span> {g.cat.label}
                        </span>
                        <span className="text-xs font-bold text-stone-400">{g.items.length}</span>
                        <div className="h-px flex-1 bg-stone-200/70" />
                      </div>
                      <CardGrid items={g.items} onSelect={setSelected} />
                    </section>
                  ))}
                </div>
              ) : (
                <CardGrid items={filtered} onSelect={setSelected} />
              )}
            </>
          )}

          {/* ドラッグオーバー時のヒント */}
          {dragOver && (
            <div className="pointer-events-none absolute inset-3 z-30 grid place-items-center rounded-3xl border-2 border-dashed border-emerald-400 bg-emerald-50/80 backdrop-blur-sm">
              <div className="text-center">
                <div className="text-5xl">📥</div>
                <p className="mt-2 font-display text-lg font-black text-emerald-700">ここにドロップ → AIが自動で棚分け</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {selected && <PreviewPanel file={selected} onClose={() => setSelected(null)} />}
      {ingest && <IngestOverlay state={ingest} />}
      {refining && (
        <IngestOverlay
          state={refining}
          title="Geminiが中身を精査中…"
          subtitle="本物のLLMが意味を理解して棚を判定しています"
          icon="🤖"
        />
      )}
      {showSettings && (
        <SettingsModal
          initialKey={getApiKey()}
          initialModel={getModel()}
          onSave={onSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}

function CardGrid({ items, onSelect }: { items: OrgFile[]; onSelect: (f: OrgFile) => void }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {items.map((f, i) => (
        <FileCard key={f.id} file={f} onClick={() => onSelect(f)} style={{ animationDelay: `${Math.min(i * 25, 400)}ms` }} />
      ))}
    </div>
  )
}

function EmptyState({ onLoadDemo }: { onLoadDemo: () => void }) {
  return (
    <div className="grid h-full place-items-center">
      <div className="max-w-md text-center">
        {/* 散らかった山 */}
        <div className="relative mx-auto mb-6 h-28 w-44">
          {['📄', '🖼️', '📕', '🧾', '🐍', '🎬', '📊', '📦'].map((e, i) => (
            <span
              key={i}
              className="absolute text-3xl"
              style={{
                left: `${(i * 37) % 150}px`,
                top: `${(i * 53) % 70}px`,
                transform: `rotate(${((i * 47) % 60) - 30}deg)`,
                opacity: 0.85,
              }}
            >
              {e}
            </span>
          ))}
        </div>
        <h1 className="font-display text-2xl font-black text-ink">Downloads、散らかっていませんか?</h1>
        <p className="mt-3 text-sm leading-relaxed text-stone-500">
          数百個のファイルが日付もバラバラに積み上がって、<br />
          探すのはファイル名を頼りにスクロール地獄。
          <br />
          <span className="font-bold text-ink">棚(Tana)</span> は中身をAIが読んで、自動で棚に戻します。
        </p>
        <button
          onClick={onLoadDemo}
          className="mt-6 rounded-xl bg-ink px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-stone-700"
        >
          🗂️ 散らかったDownloadsを読み込んでみる
        </button>
        <p className="mt-3 text-xs text-stone-400">またはファイルをこの画面にドラッグ&ドロップ</p>
      </div>
    </div>
  )
}

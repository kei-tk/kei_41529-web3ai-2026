import { useState } from 'react'
import { DEFAULT_MODEL, testGemini } from '../lib/llm'

// v3: Gemini(本物のLLM)を使うための設定。キーはこのブラウザの localStorage のみに保存。
export default function SettingsModal({
  initialKey,
  initialModel,
  onSave,
  onClose,
}: {
  initialKey: string
  initialModel: string
  onSave: (key: string, model: string) => void
  onClose: () => void
}) {
  const [key, setKey] = useState(initialKey)
  const [model, setModel] = useState(initialModel || DEFAULT_MODEL)
  const [testState, setTestState] = useState<{ kind: 'idle' | 'loading' | 'ok' | 'err'; msg?: string }>({ kind: 'idle' })

  const runTest = async () => {
    setTestState({ kind: 'loading' })
    try {
      const msg = await testGemini(key.trim(), model.trim() || DEFAULT_MODEL)
      setTestState({ kind: 'ok', msg })
    } catch (e) {
      setTestState({ kind: 'err', msg: e instanceof Error ? e.message : String(e) })
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" role="dialog" aria-modal>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-[min(520px,94vw)] rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-black/5">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <h2 className="font-display text-lg font-black">AIモード設定(Gemini)</h2>
        </div>
        <p className="mb-4 text-xs leading-relaxed text-stone-500">
          自分の Gemini API キーを入れると、分類が<strong className="text-ink">ルールベース → 本物のLLM</strong>に切り替わり、
          中身を意味で理解して仕分けます。キーは<strong className="text-ink">このブラウザ内(localStorage)だけ</strong>に保存され、
          送信先は Google の API のみです。
        </p>

        <label className="mb-1 block text-xs font-bold text-stone-500">API キー</label>
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          type="password"
          placeholder="AIza..."
          className="mb-3 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 font-mono text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
        />

        <label className="mb-1 block text-xs font-bold text-stone-500">モデル名</label>
        <input
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder={DEFAULT_MODEL}
          className="mb-3 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 font-mono text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
        />

        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={runTest}
            disabled={!key.trim() || testState.kind === 'loading'}
            className="rounded-lg bg-stone-100 px-3 py-1.5 text-xs font-bold text-stone-700 transition hover:bg-stone-200 disabled:opacity-40"
          >
            {testState.kind === 'loading' ? '接続中…' : '接続テスト'}
          </button>
          {testState.kind === 'ok' && <span className="text-xs font-bold text-emerald-600">✅ {testState.msg}</span>}
          {testState.kind === 'err' && <span className="truncate text-xs font-bold text-rose-600">⚠️ {testState.msg}</span>}
        </div>

        <p className="mb-4 text-[11px] text-stone-400">
          キーは{' '}
          <span className="font-mono">aistudio.google.com/app/apikey</span>{' '}
          で無料発行できます。空欄で保存するとルールベースに戻ります。
        </p>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-bold text-stone-500 hover:text-ink">
            キャンセル
          </button>
          <button
            onClick={() => onSave(key.trim(), model.trim() || DEFAULT_MODEL)}
            className="rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white transition hover:bg-stone-700"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}

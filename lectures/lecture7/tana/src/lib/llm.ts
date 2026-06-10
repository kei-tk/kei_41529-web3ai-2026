import type { CategoryId } from '../types'
import type { ClassifyResult } from './classify'

// ── v3: 本物のLLM(Gemini)で中身を意味理解して仕分ける ──────────────
// 静的サイト(GitHub Pages)なのでサーバーは持たず、ユーザー自身のAPIキーを
// ブラウザから直接 Gemini に投げる BYOK 方式。キーは localStorage のみに保存し、
// 送信先は Google の API だけ(このアプリのサーバーには送らない=そもそも無い)。

const VALID: CategoryId[] = ['lecture', 'assignment', 'report', 'code', 'image', 'media', 'finance', 'archive', 'other']

const CATEGORY_GUIDE = `
- lecture: 講義資料・スライド・レジュメ
- assignment: 課題・宿題・演習・提出物
- report: レポート・報告書・履歴書などの書類
- code: ソースコード・スクリプト
- image: 画像・スクリーンショット・写真
- media: 動画・音声
- finance: 領収書・請求書・お金関連
- archive: zip など圧縮ファイル
- other: 上記に当てはまらないもの`

export interface LlmInput {
  index: number
  name: string
  ext: string
  content?: string
}

const STORE_KEY = 'tana_gemini_key'
const STORE_MODEL = 'tana_gemini_model'
export const DEFAULT_MODEL = 'gemini-2.5-flash'

export function getApiKey(): string {
  return localStorage.getItem(STORE_KEY) ?? ''
}
export function setApiKey(v: string) {
  if (v) localStorage.setItem(STORE_KEY, v)
  else localStorage.removeItem(STORE_KEY)
}
export function getModel(): string {
  return localStorage.getItem(STORE_MODEL) || DEFAULT_MODEL
}
export function setModel(v: string) {
  localStorage.setItem(STORE_MODEL, v || DEFAULT_MODEL)
}

// 1リクエストあたりのファイル数(トークン超過を避けるため分割)
const BATCH = 12

// 複数ファイルをまとめて分類。失敗時は例外を投げる(呼び出し側でルールベースにフォールバック)。
export async function classifyWithGemini(
  inputs: LlmInput[],
  apiKey: string,
  model: string,
  onProgress?: (done: number, total: number) => void,
): Promise<Map<number, ClassifyResult>> {
  const out = new Map<number, ClassifyResult>()
  let done = 0
  for (let i = 0; i < inputs.length; i += BATCH) {
    const chunk = inputs.slice(i, i + BATCH)
    const results = await callGeminiOnce(chunk, apiKey, model)
    for (const r of results) out.set(r.index, r.result)
    done += chunk.length
    onProgress?.(Math.min(done, inputs.length), inputs.length)
  }
  return out
}

async function callGeminiOnce(
  chunk: LlmInput[],
  apiKey: string,
  model: string,
): Promise<{ index: number; result: ClassifyResult }[]> {
  const list = chunk
    .map((f) => `[#${f.index}] name="${f.name}" ext="${f.ext}"\n中身: ${truncate(f.content) || '(テキストなし)'}`)
    .join('\n---\n')

  const prompt = `あなたはファイル整理アシスタントです。日本のある大学生のダウンロードフォルダのファイルを、中身まで読んで仕分けます。
各ファイルについて、次を判定してください。
- category: 次のいずれかのidを1つ。${CATEGORY_GUIDE}
- subject: 学校の科目名(例: web3・AI概論 / 数学 / プログラミング / 英語 など)。不明なら null。
- tags: 内容を表す短いタグ最大5個(日本語可)。
- summary: 中身を踏まえた日本語の一言サマリ(40字以内)。
- confidence: 判定の自信度 0-100 の整数。

ファイル一覧:
${list}

出力は必ず次の形式のJSON配列のみ:
[{"index": <番号>, "category": "<id>", "subject": <文字列 or null>, "tags": ["..."], "summary": "...", "confidence": <0-100>}]`

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0 },
    }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Gemini API ${res.status}: ${body.slice(0, 200)}`)
  }
  const data = await res.json()
  const text: string = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? ''
  const parsed = safeParseArray(text)

  return parsed
    .map((row) => {
      const idx = Number(row.index)
      const category: CategoryId = VALID.includes(row.category) ? row.category : 'other'
      const result: ClassifyResult = {
        category,
        subject: row.subject ? String(row.subject) : undefined,
        tags: Array.isArray(row.tags) ? row.tags.map(String).slice(0, 5) : [],
        summary: String(row.summary ?? ''),
        confidence: clampInt(row.confidence, 0, 100, 80),
      }
      return { index: idx, result }
    })
    .filter((r) => Number.isFinite(r.index))
}

function truncate(s?: string): string {
  if (!s) return ''
  return s.replace(/\s+/g, ' ').trim().slice(0, 1200)
}

function clampInt(v: unknown, lo: number, hi: number, fallback: number): number {
  const n = Math.round(Number(v))
  if (!Number.isFinite(n)) return fallback
  return Math.max(lo, Math.min(hi, n))
}

// モデルが ```json などで包んできても拾えるようにする
function safeParseArray(text: string): any[] {
  try {
    const direct = JSON.parse(text)
    if (Array.isArray(direct)) return direct
  } catch {
    /* fall through */
  }
  const m = text.match(/\[[\s\S]*\]/)
  if (m) {
    try {
      const arr = JSON.parse(m[0])
      if (Array.isArray(arr)) return arr
    } catch {
      /* ignore */
    }
  }
  return []
}

// キーの有効性を軽く確認(設定画面のテスト用)
export async function testGemini(apiKey: string, model: string): Promise<string> {
  const map = await classifyWithGemini(
    [{ index: 0, name: 'test_第6回講義.pdf', ext: 'pdf', content: 'web3 AI概論 VPC 講義スライド' }],
    apiKey,
    model,
  )
  const r = map.get(0)
  if (!r) throw new Error('応答を解釈できませんでした')
  return `OK: 「${r.summary || r.category}」と分類できました`
}

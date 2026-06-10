import type { CategoryId } from '../types'

// ── 棚(Tana)の分類エンジン ──────────────────────────────
// VPC の核心:「DLした瞬間にAIが中身を読んで自動でフォルダ分類」を再現する部分。
// ファイル名・拡張子・(テキストなら)中身を見て、カテゴリ/科目/タグ/サマリを推定する。
// 本物の LLM ではなくルールベースだが、"中身を読んで意味で振り分ける" 体験は同じ。

// 拡張子 → カテゴリの素直なマッピング(中身ヒントが無いときの土台)
const EXT_CATEGORY: Record<string, CategoryId> = {
  py: 'code', js: 'code', ts: 'code', tsx: 'code', jsx: 'code', html: 'code', css: 'code',
  json: 'code', ipynb: 'code', java: 'code', c: 'code', cpp: 'code', go: 'code', rb: 'code',
  png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', webp: 'image', heic: 'image', svg: 'image',
  mp4: 'media', mov: 'media', mp3: 'media', wav: 'media', m4a: 'media', avi: 'media',
  zip: 'archive', rar: 'archive', '7z': 'archive', tar: 'archive', gz: 'archive',
}

// 科目(教科)を判定するキーワード辞書。名前+中身に含まれていれば命中。
const SUBJECT_RULES: { subject: string; keywords: string[] }[] = [
  { subject: 'web3・AI概論', keywords: ['web3', 'ai概論', 'antigravity', 'vpc', 'バグリスト', 'gemini', 'blockchain', 'ブロックチェーン', 'join', 'ichigo', 'penguin', 'ペンギンミックス'] },
  { subject: 'プログラミング', keywords: ['python', 'javascript', 'react', 'アルゴリズム', '関数', 'class ', 'def ', 'import ', 'コンパイル', 'デバッグ'] },
  { subject: '数学・線形代数', keywords: ['微分', '積分', '行列', '線形代数', '確率', 'ベクトル', '固有値', 'theorem', '定理'] },
  { subject: '英語', keywords: ['english', 'toeic', '英作文', 'essay', 'vocabulary', '長文読解'] },
  { subject: '物理', keywords: ['力学', '電磁気', '運動方程式', '熱力学', '波動', 'newton'] },
  { subject: 'デザイン', keywords: ['figma', 'デザイン', 'ui設計', 'photoshop', 'illustrator', 'ワイヤーフレーム'] },
]

// カテゴリを"意味"で判定するキーワード(拡張子より優先)。
const CATEGORY_RULES: { category: CategoryId; keywords: string[] }[] = [
  { category: 'lecture', keywords: ['講義', 'lecture', 'スライド', 'slide', '授業', '第', '回目', 'レジュメ', '配布資料'] },
  { category: 'assignment', keywords: ['課題', 'assignment', 'homework', '宿題', '提出', '締切', 'kadai', 'ワーク', '演習'] },
  { category: 'report', keywords: ['レポート', 'report', '報告書', '履歴書', '申請', '証明書', 'まとめ', '考察'] },
  { category: 'finance', keywords: ['領収書', 'invoice', 'receipt', '請求', '明細', '見積', '振込', '支払', '料金'] },
]

// よく拾いたい中身キーワード(タグ候補)
const TAG_KEYWORDS = [
  'web3', 'AI', 'VPC', 'Antigravity', 'Python', 'React', 'Gemini', '課題', '提出', '締切',
  '講義', 'レポート', '微分', '行列', 'TOEIC', '領収書', '設計', 'バグ', 'スクショ', 'メモ',
]

const TEXT_EXTS = new Set(['txt', 'md', 'csv', 'json', 'py', 'js', 'ts', 'html', 'css', 'log'])
export function isTextLike(ext: string): boolean {
  return TEXT_EXTS.has(ext.toLowerCase())
}

export function getExt(name: string): string {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/)
  return m ? m[1] : ''
}

// ファイル名から日付を拾う(2026-05-21 / 20260521 / 2026521 / 2026.5.21 など)
export function extractDateFromName(name: string): number | null {
  const m = name.match(/(20\d{2})[._-]?(\d{1,2})[._-]?(\d{1,2})/)
  if (!m) return null
  const [, y, mo, d] = m
  const month = Number(mo), day = Number(d)
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  const t = new Date(Number(y), month - 1, day).getTime()
  return Number.isNaN(t) ? null : t
}

function countHits(haystack: string, keywords: string[]): { hits: number; matched: string[] } {
  const matched: string[] = []
  for (const k of keywords) {
    if (haystack.includes(k.toLowerCase())) matched.push(k)
  }
  return { hits: matched.length, matched }
}

export interface ClassifyResult {
  category: CategoryId
  subject?: string
  tags: string[]
  summary: string
  confidence: number
}

// 中身(name + textContent)を読んで分類する中核関数。
export function classify(name: string, ext: string, textContent?: string): ClassifyResult {
  const hay = `${name} ${textContent ?? ''}`.toLowerCase()
  let confidence = 40

  // 1. 科目判定
  let subject: string | undefined
  let bestSubjectHits = 0
  for (const rule of SUBJECT_RULES) {
    const { hits } = countHits(hay, rule.keywords)
    if (hits > bestSubjectHits) {
      bestSubjectHits = hits
      subject = rule.subject
    }
  }
  if (subject) confidence += Math.min(25, bestSubjectHits * 12)

  // 2. カテゴリ判定:まず意味(キーワード)、無ければ拡張子。
  let category: CategoryId = 'other'
  let bestCatHits = 0
  for (const rule of CATEGORY_RULES) {
    const { hits } = countHits(hay, rule.keywords)
    if (hits > bestCatHits) {
      bestCatHits = hits
      category = rule.category
    }
  }
  if (bestCatHits > 0) {
    confidence += Math.min(25, bestCatHits * 12)
  } else if (EXT_CATEGORY[ext]) {
    category = EXT_CATEGORY[ext]
    confidence += 15
  }
  // 画像/メディア/コードは拡張子が強い証拠なので上書き優先
  const extCat = EXT_CATEGORY[ext]
  if (extCat && (extCat === 'image' || extCat === 'media' || extCat === 'code' || extCat === 'archive') && bestCatHits === 0) {
    category = extCat
  }

  // 3. タグ抽出(科目・命中キーワード・日付ラベル)
  const tagSet = new Set<string>()
  if (subject) tagSet.add(subject)
  for (const k of TAG_KEYWORDS) {
    if (hay.includes(k.toLowerCase())) tagSet.add(k)
  }
  const dateMs = extractDateFromName(name)
  if (dateMs) {
    const dt = new Date(dateMs)
    tagSet.add(`${dt.getFullYear()}年${dt.getMonth() + 1}月`)
  }
  const tags = Array.from(tagSet).slice(0, 5)

  // 4. 一言サマリを組み立て
  const summary = buildSummary(category, subject, name, textContent)

  return { category, subject, tags, summary, confidence: Math.min(99, confidence) }
}

const CAT_LABEL: Record<CategoryId, string> = {
  lecture: '講義資料', assignment: '課題', report: 'レポート・書類', code: 'コード',
  image: '画像', media: 'メディア', finance: '領収書', archive: '圧縮ファイル', other: 'ファイル',
}

function buildSummary(category: CategoryId, subject: string | undefined, name: string, text?: string): string {
  const head = subject ? `${subject}の${CAT_LABEL[category]}` : CAT_LABEL[category]
  // テキストがあれば中身の冒頭を要約っぽく添える
  if (text) {
    const clean = text.replace(/\s+/g, ' ').trim().slice(0, 38)
    if (clean) return `${head} — 「${clean}…」`
  }
  return `${head}(${name})`
}

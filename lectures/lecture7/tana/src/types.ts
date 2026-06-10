// 棚(Tana)の中心データモデル。1ファイル = 1 OrgFile。
// category / subject / tags / summary は AI(classify.ts)が中身から推定する。

export type CategoryId =
  | 'lecture' // 講義資料
  | 'assignment' // 課題・宿題
  | 'report' // レポート・書類
  | 'code' // コード
  | 'image' // 画像・スクショ
  | 'media' // 動画・音声
  | 'finance' // 領収書・お金
  | 'archive' // 圧縮ファイル
  | 'other' // その他

export interface OrgFile {
  id: string
  name: string
  ext: string
  sizeKB: number
  modified: number // epoch ms
  // テキスト系ファイルなら中身(AIが読む対象)。なければ undefined。
  textContent?: string
  // ↓ ここから下は AI が推定する欄
  category: CategoryId
  subject?: string // 科目
  tags: string[]
  summary?: string // AI が付ける一言サマリ
  confidence: number // 0-100 推定の自信度
  engine?: 'rule' | 'llm' // どの分類エンジンが付けたか(v3: Gemini=llm / 従来=rule)
}

// デモ用の「散らかった Downloads フォルダ」。
// カテゴリ等はあえて持たせず、classify エンジンに通して自動分類させる
// (= AIが中身を読んで振り分ける体験を、サンプルでもそのまま再現する)。

export interface RawFile {
  name: string
  sizeKB: number
  daysAgo: number // 何日前にDLしたか
  textContent?: string // テキスト系のみ
}

export const DEMO_FILES: RawFile[] = [
  {
    name: '2026521 第六回講義_s.pdf',
    sizeKB: 4820,
    daysAgo: 13,
    textContent: 'web3・AI概論 第6回 自分のやりたいことを深掘って設計する VPC バリュープロポジションキャンバス 顧客 ペイン ゲイン',
  },
  {
    name: 'bug-list.md',
    sizeKB: 3,
    daysAgo: 27,
    textContent: '困りごとを20個書く ファイル整理 電車遅延 課題管理 検索タブ管理 いらない通知 睡眠不足 履修登録 web3 バグリスト',
  },
  {
    name: 'スクリーンショット 2026-05-30 14.22.10.png',
    sizeKB: 1240,
    daysAgo: 4,
  },
  { name: 'IMG_4821.HEIC', sizeKB: 2980, daysAgo: 9 },
  {
    name: 'レポート_最終版_本当に最終_これで提出.docx',
    sizeKB: 88,
    daysAgo: 6,
    textContent: '線形代数レポート 行列の固有値と固有ベクトルについて 考察 結論 提出 締切',
  },
  {
    name: 'kadai3_python_提出用.py',
    sizeKB: 5,
    daysAgo: 11,
    textContent: 'def solve(n): import sys # アルゴリズム課題 フィボナッチ Python 提出 演習',
  },
  {
    name: '領収書_20260415_書店.pdf',
    sizeKB: 142,
    daysAgo: 49,
    textContent: '領収書 株式会社 書店 金額 1,980円 但し書籍代として 請求',
  },
  { name: 'invoice_amazon_2026-05-02.pdf', sizeKB: 96, daysAgo: 32, textContent: 'invoice receipt amazon 明細 支払 合計' },
  {
    name: 'toeic_単語リスト.csv',
    sizeKB: 22,
    daysAgo: 40,
    textContent: 'english,意味\nabandon,放棄する\nvocabulary,語彙 TOEIC 長文読解',
  },
  {
    name: 'vpc-v1.md',
    sizeKB: 4,
    daysAgo: 27,
    textContent: 'VPC v1 顧客プロファイル Jobs Pains Gains ファイル整理 Downloadsに数百個 スクロール地獄 web3 自動でフォルダ分類',
  },
  { name: 'IMG_4822.jpg', sizeKB: 3120, daysAgo: 9 },
  { name: 'ダウンロード (3).zip', sizeKB: 15600, daysAgo: 18 },
  {
    name: '微分積分_演習問題_第5章.pdf',
    sizeKB: 760,
    daysAgo: 21,
    textContent: '微分 積分 演習問題 第5章 極限 テイラー展開 数学 課題',
  },
  { name: 'スクリーンショット 2026-04-18 09.03.55.png', sizeKB: 880, daysAgo: 46 },
  {
    name: 'antigravity_メモ.txt',
    sizeKB: 2,
    daysAgo: 15,
    textContent: 'Antigravity でリポジトリ作成 gh repo create push web3 課題 メモ Gemini',
  },
  { name: '名称未設定.txt', sizeKB: 1, daysAgo: 3, textContent: 'あとで消す とりあえずメモ' },
  { name: '会議録画_20260520.mp4', sizeKB: 248000, daysAgo: 14, textContent: undefined },
  {
    name: 'react_練習.tsx',
    sizeKB: 7,
    daysAgo: 8,
    textContent: 'import React from "react" function App() { return <div/> } useState コンポーネント プログラミング',
  },
  { name: 'figma_export_ui設計.png', sizeKB: 1680, daysAgo: 12, textContent: undefined },
  {
    name: '履歴書_2026.pdf',
    sizeKB: 210,
    daysAgo: 60,
    textContent: '履歴書 氏名 学歴 志望動機 提出 書類',
  },
  { name: 'music_sample.mp3', sizeKB: 5400, daysAgo: 70 },
  { name: 'IMG_4830.jpg', sizeKB: 2760, daysAgo: 2 },
  {
    name: '第四回講義_ss.pdf',
    sizeKB: 3960,
    daysAgo: 20,
    textContent: 'web3 AI概論 第4回 技術 AIの全体像 講義 スライド',
  },
  { name: 'untitled-1.png', sizeKB: 540, daysAgo: 5 },
  {
    name: 'gemini_出力_保存.txt',
    sizeKB: 9,
    daysAgo: 7,
    textContent: 'Gemini 出力結果 7軸スコア タグ付け web3 AI 保存 メモ',
  },
  { name: 'archive_old.7z', sizeKB: 42000, daysAgo: 120 },
]

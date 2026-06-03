import type { OrgFile } from '../types'
import { classify, getExt, isTextLike, extractDateFromName } from './classify'
import { DEMO_FILES, type RawFile } from './demoData'

let idCounter = 0
const nextId = () => `f${Date.now()}_${idCounter++}`

// RawFile / 実 File を OrgFile に変換する。日付はファイル名の日付を優先。
function buildOrgFile(name: string, sizeKB: number, modified: number, textContent?: string): OrgFile {
  const ext = getExt(name)
  const nameDate = extractDateFromName(name)
  const result = classify(name, ext, textContent)
  return {
    id: nextId(),
    name,
    ext,
    sizeKB,
    modified: nameDate ?? modified,
    textContent,
    ...result,
  }
}

// デモデータを OrgFile 化(classify を通すので分類は本物のエンジンが行う)
export function buildDemoFiles(): OrgFile[] {
  const now = Date.now()
  const day = 86400000
  return DEMO_FILES.map((r: RawFile) =>
    buildOrgFile(r.name, r.sizeKB, now - r.daysAgo * day, r.textContent),
  )
}

// 実際にドロップ/選択された File を読み込む。テキスト系は中身も読む。
export async function ingestRealFiles(files: FileList | File[]): Promise<OrgFile[]> {
  const arr = Array.from(files)
  const out: OrgFile[] = []
  for (const file of arr) {
    const ext = getExt(file.name)
    let text: string | undefined
    if (isTextLike(ext) && file.size < 512 * 1024) {
      try {
        text = await file.text()
      } catch {
        text = undefined
      }
    }
    out.push(buildOrgFile(file.name, Math.round(file.size / 1024), file.lastModified, text))
  }
  return out
}

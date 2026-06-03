import type { OrgFile } from '../types'
import { CATEGORY_MAP } from '../lib/categories'
import { formatSize, relativeDate } from '../lib/format'

// 拡張子ごとの簡易アイコン(画像は枠だけ別表現)
const EXT_ICON: Record<string, string> = {
  pdf: '📕', docx: '📘', doc: '📘', md: '📝', txt: '📄', csv: '📊', xlsx: '📊',
  py: '🐍', js: '🟨', ts: '🟦', tsx: '⚛️', html: '🌐', css: '🎨', json: '🔧',
  png: '🖼️', jpg: '🖼️', jpeg: '🖼️', heic: '🖼️', gif: '🖼️', svg: '🖼️',
  mp4: '🎬', mov: '🎬', mp3: '🎵', wav: '🎵', zip: '🗜️', '7z': '🗜️', rar: '🗜️',
}

export default function FileCard({ file, onClick, style }: { file: OrgFile; onClick: () => void; style?: React.CSSProperties }) {
  const cat = CATEGORY_MAP[file.category]
  const icon = EXT_ICON[file.ext] ?? '📦'
  return (
    <button
      onClick={onClick}
      style={style}
      className="animate-slot group flex flex-col gap-2 rounded-2xl border border-stone-200/80 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
    >
      <div className="flex items-start gap-3">
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl ${cat.bg} ring-1 ${cat.ring}`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-ink" title={file.name}>
            {file.name}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-stone-400">
            <span className="uppercase">{file.ext || 'file'}</span>
            <span>·</span>
            <span>{formatSize(file.sizeKB)}</span>
            <span>·</span>
            <span>{relativeDate(file.modified)}</span>
          </div>
        </div>
      </div>

      {/* AI が付けた一言サマリ */}
      <p className="line-clamp-2 text-xs leading-relaxed text-stone-500">{file.summary}</p>

      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${cat.bg} ${cat.text}`}>
          <span>{cat.emoji}</span>
          {cat.label}
        </span>
        {file.subject && (
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600">
            {file.subject}
          </span>
        )}
      </div>
    </button>
  )
}

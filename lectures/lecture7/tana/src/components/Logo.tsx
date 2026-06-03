// 棚(Tana)のロゴマーク。木の棚に物が収まっているイメージ。
export default function Logo({ size = 36 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
        <rect x="3" y="5" width="42" height="38" rx="9" fill="#211f1c" />
        <rect x="9" y="12" width="30" height="2.4" rx="1.2" fill="#b08968" />
        <rect x="9" y="23" width="30" height="2.4" rx="1.2" fill="#b08968" />
        <rect x="9" y="34" width="30" height="2.4" rx="1.2" fill="#b08968" />
        {/* 棚に並ぶ物 */}
        <rect x="12" y="15.5" width="4" height="7" rx="1" fill="#6366f1" />
        <rect x="17.5" y="16.5" width="4" height="6" rx="1" fill="#f43f5e" />
        <rect x="23" y="14.5" width="4" height="8" rx="1" fill="#10b981" />
        <rect x="13" y="27" width="4" height="6.5" rx="1" fill="#f59e0b" />
        <rect x="18.5" y="26" width="4" height="7.5" rx="1" fill="#0ea5e9" />
        <rect x="29" y="27.5" width="4" height="6" rx="1" fill="#14b8a6" />
      </svg>
      <div className="leading-none">
        <div className="font-display text-xl font-black tracking-tight text-ink">棚</div>
        <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">Tana</div>
      </div>
    </div>
  )
}

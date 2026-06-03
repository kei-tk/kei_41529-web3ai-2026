import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// React + Tailwind v4 のプラグイン構成。
// GitHub Pages(プロジェクトページ)では /kei_41529-web3ai-2026/ 配下に置かれるため、
// build 時のみ base を合わせる。dev はルートのまま。
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/kei_41529-web3ai-2026/' : '/',
  plugins: [react(), tailwindcss()],
}))

import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: '#FFE048',
        'gvc-black': '#050505',
        'gvc-dark': '#121212',
        'gvc-gray': '#1F1F1F',
        'gvc-green': '#2EFF2E',
        'gvc-pink': '#FF6B9D',
      },
    },
  },
  plugins: [],
}
export default config

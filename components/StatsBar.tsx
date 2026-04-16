'use client'

import { motion } from 'framer-motion'
import { Holder } from '@/lib/holders'
import { Users, TrendingUp, TrendingDown, Sparkles, Star } from 'lucide-react'

interface Props {
  holders: Holder[]
}

export default function StatsBar({ holders }: Props) {
  const active = holders.filter(h => h.status === 'active').length
  const inactive = holders.filter(h => h.status === 'inactive').length
  const newH = holders.filter(h => h.status === 'new').length
  const totalNFTs = holders.reduce((s, h) => s + h.nftCount, 0)
  const avgVibe = Math.round(holders.reduce((s, h) => s + h.vibeScore, 0) / holders.length)

  const stats = [
    { label: 'Total Holders', value: holders.length, icon: <Users size={16} />, color: 'var(--text-primary)' },
    { label: 'Active', value: active, icon: <TrendingUp size={16} />, color: 'var(--green)' },
    { label: 'Inactive', value: inactive, icon: <TrendingDown size={16} />, color: 'var(--text-muted)' },
    { label: 'New', value: newH, icon: <Sparkles size={16} />, color: 'var(--gold)' },
    { label: 'Total GVCs', value: totalNFTs, icon: <Star size={16} />, color: 'var(--gold)' },
    { label: 'Avg Vibe Score', value: `${avgVibe}`, icon: <Star size={16} />, color: avgVibe >= 60 ? 'var(--gold)' : 'var(--text-muted)' },
  ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: 12,
    }}>
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          style={{
            background: 'var(--card)',
            border: '1px solid var(--gray)',
            borderRadius: 12,
            padding: '16px 18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: s.color, marginBottom: 8 }}>
            {s.icon}
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              {s.label}
            </span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: s.color, letterSpacing: '-0.03em' }}>
            {s.value}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

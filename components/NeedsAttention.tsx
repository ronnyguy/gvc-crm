'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Holder } from '@/lib/holders'
import { getLockStatus, getLastOutreach, getCooldownForHolder, DEFAULT_COOLDOWN_DAYS } from '@/lib/crm-store'
import { AlertCircle, Clock, Zap, ChevronRight } from 'lucide-react'
import { shortenWallet } from '@/lib/contract'

interface NeedsAttentionHolder {
  holder: Holder
  daysSinceContact: number | null // null = never contacted
  cooldownDays: number
  urgency: 'critical' | 'high' | 'medium'
}

interface Props {
  holders: Holder[]
  selected: string[]
  onToggleSelect: (id: string) => void
  onOpenOutreach: () => void
}

export default function NeedsAttention({ holders, selected, onToggleSelect, onOpenOutreach }: Props) {
  const [items, setItems] = useState<NeedsAttentionHolder[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const now = Date.now()

    const overdue: NeedsAttentionHolder[] = []

    holders.forEach(h => {
      const cooldown = getCooldownForHolder(h.id)
      const last = getLastOutreach(h.id)
      const lock = getLockStatus(h.id)

      // Skip if currently locked (recently contacted)
      if (lock.locked) return

      let daysSince: number | null = null

      if (last) {
        daysSince = Math.floor((now - new Date(last.timestamp).getTime()) / (1000 * 60 * 60 * 24))
        // Only flag if past cooldown
        if (daysSince <= cooldown) return
      }

      // Determine urgency
      let urgency: 'critical' | 'high' | 'medium' = 'medium'
      if (daysSince === null) {
        urgency = 'critical' // never contacted
      } else if (daysSince > cooldown * 2) {
        urgency = 'critical'
      } else if (daysSince > cooldown * 1.5) {
        urgency = 'high'
      }

      overdue.push({ holder: h, daysSinceContact: daysSince, cooldownDays: cooldown, urgency })
    })

    // Sort: never contacted first, then by days overdue descending
    overdue.sort((a, b) => {
      if (a.daysSinceContact === null && b.daysSinceContact !== null) return -1
      if (a.daysSinceContact !== null && b.daysSinceContact === null) return 1
      return (b.daysSinceContact ?? 0) - (a.daysSinceContact ?? 0)
    })

    setItems(overdue)
  }, [holders])

  if (!mounted) return null

  const urgencyConfig = {
    critical: { color: '#FF4444', bg: 'rgba(255,68,68,0.06)', label: 'Critical', border: 'rgba(255,68,68,0.2)' },
    high: { color: '#FF6B9D', bg: 'rgba(255,107,157,0.06)', label: 'High', border: 'rgba(255,107,157,0.2)' },
    medium: { color: '#FFE048', bg: 'rgba(255,224,72,0.06)', label: 'Due', border: 'rgba(255,224,72,0.15)' },
  }

  const statusColors: Record<string, string> = {
    active: '#2EFF2E', inactive: '#555', new: '#FFE048',
  }

  const critical = items.filter(i => i.urgency === 'critical').length
  const high = items.filter(i => i.urgency === 'high').length

  if (items.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'var(--dark)', border: '1px solid var(--gray)', borderRadius: 16, padding: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>All caught up</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No holders are overdue for outreach right now</div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: 'var(--dark)', border: '1px solid var(--gray)', borderRadius: 16, overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={16} style={{ color: '#FF4444' }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Needs Attention</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
              {items.length} holder{items.length !== 1 ? 's' : ''} overdue
              {critical > 0 && <span style={{ color: '#FF4444', marginLeft: 6, fontWeight: 600 }}>{critical} critical</span>}
              {high > 0 && <span style={{ color: '#FF6B9D', marginLeft: 6, fontWeight: 600 }}>{high} high</span>}
            </div>
          </div>
        </div>
        {selected.length > 0 && (
          <button onClick={onOpenOutreach} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
            background: 'var(--gold)', border: 'none', borderRadius: 8,
            color: '#050505', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>
            <Zap size={13} /> Reach out ({selected.length})
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {items.map((item, i) => {
          const { holder, daysSinceContact, urgency } = item
          const uc = urgencyConfig[urgency]
          const isSelected = selected.includes(holder.id)

          return (
            <motion.div key={holder.id}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              onClick={() => onToggleSelect(holder.id)}
              style={{
                padding: '14px 20px',
                borderBottom: i < items.length - 1 ? '1px solid var(--gray)' : 'none',
                display: 'flex', alignItems: 'center', gap: 14,
                background: isSelected ? 'rgba(255,224,72,0.03)' : 'transparent',
                cursor: 'pointer', transition: 'background 0.15s',
                borderLeft: `3px solid ${isSelected ? 'var(--gold)' : uc.color}`,
              }}
              onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isSelected ? 'rgba(255,224,72,0.03)' : 'transparent' }}
            >
              {/* Checkbox */}
              <div style={{
                width: 18, height: 18, border: `1.5px solid ${isSelected ? 'var(--gold)' : 'var(--gray-light)'}`,
                borderRadius: 4, background: isSelected ? 'var(--gold)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s',
              }}>
                {isSelected && <span style={{ color: '#050505', fontSize: 10, fontWeight: 900 }}>✓</span>}
              </div>

              {/* Avatar */}
              <div style={{
                width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                background: `${statusColors[holder.status]}22`,
                border: `1px solid ${statusColors[holder.status]}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: statusColors[holder.status],
              }}>
                {(holder.ens || holder.twitter).slice(1, 2).toUpperCase()}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {holder.ens || holder.twitter}
                  </span>
                  <span style={{
                    padding: '2px 7px', borderRadius: 20, fontSize: 10, fontWeight: 600,
                    background: uc.bg, border: `1px solid ${uc.border}`, color: uc.color,
                  }}>
                    {uc.label}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {holder.twitter} · {holder.nftCount} GVC{holder.nftCount !== 1 ? 's' : ''}
                  {holder.notes && <span style={{ marginLeft: 8, color: '#444' }}>· {holder.notes.slice(0, 50)}...</span>}
                </div>
              </div>

              {/* Time indicator */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: uc.color, fontSize: 12, fontWeight: 700 }}>
                  <Clock size={12} />
                  {daysSinceContact === null ? 'Never contacted' : `${daysSinceContact}d ago`}
                </div>
                <div style={{ fontSize: 10, color: '#444', marginTop: 2 }}>
                  {daysSinceContact === null ? 'No outreach logged' : `Cooldown: ${item.cooldownDays}d`}
                </div>
              </div>

              <ChevronRight size={14} style={{ color: '#333', flexShrink: 0 }} />
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

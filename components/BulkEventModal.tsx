'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Holder } from '@/lib/holders'
import { addEvent, EventType, EVENT_LABELS, EVENT_ICONS, TeamMember, TEAM_COLORS } from '@/lib/crm-store'
import { X, CheckCircle, Zap } from 'lucide-react'
import { useToast } from './Toast'

interface Props {
  holders: Holder[]
  activeUser: TeamMember
  onClose: () => void
  onComplete: () => void
}

const EVENT_TYPES: EventType[] = [
  'bought_oe', 'attended_space', 'retweeted', 'responded_dm',
  'discord_active', 'quest_completed', 'custom',
]

export default function BulkEventModal({ holders, activeUser, onClose, onComplete }: Props) {
  const { toast } = useToast()
  const [selectedHolders, setSelectedHolders] = useState<Set<string>>(new Set(holders.map(h => h.id)))
  const [eventType, setEventType] = useState<EventType>('attended_space')
  const [note, setNote] = useState('')
  const [done, setDone] = useState(false)

  const toggleHolder = (id: string) => {
    setSelectedHolders(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectAll = () => setSelectedHolders(new Set(holders.map(h => h.id)))
  const clearAll = () => setSelectedHolders(new Set())

  const logAll = () => {
    const targets = holders.filter(h => selectedHolders.has(h.id))
    targets.forEach(h => {
      addEvent({
        holderId: h.id,
        type: eventType,
        label: EVENT_LABELS[eventType],
        note: note || undefined,
        by: activeUser,
      })
    })
    setDone(true)
    toast('vibe', `Logged for ${targets.length} holders`, EVENT_LABELS[eventType])
    setTimeout(() => { onComplete(); onClose() }, 1200)
  }

  const statusColors: Record<string, string> = { active: '#2EFF2E', inactive: '#555', new: '#FFE048' }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 110, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        style={{ background: 'var(--dark)', border: '1px solid var(--gray)', borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}
      >
        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--gray)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div className="font-brice" style={{ fontSize: 16, color: 'var(--gold)' }}>Bulk Event Log</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              Log one event across multiple holders at once
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, background: 'var(--gray)', border: 'none', borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Event type */}
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 10 }}>Event type</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {EVENT_TYPES.map(type => (
                <button key={type} onClick={() => setEventType(type)} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                  background: eventType === type ? 'rgba(255,224,72,0.08)' : 'var(--gray)',
                  border: `1px solid ${eventType === type ? 'var(--gold)' : 'var(--gray-light)'}`,
                  borderRadius: 9, cursor: 'pointer', transition: 'all 0.15s',
                  color: eventType === type ? 'var(--gold)' : 'var(--text-secondary)',
                  fontSize: 12, fontWeight: eventType === type ? 600 : 400, textAlign: 'left',
                }}>
                  <span style={{ fontSize: 16 }}>{EVENT_ICONS[type]}</span>
                  {EVENT_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Optional note */}
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 8 }}>Note (optional)</div>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Space Jan 14, Highkey OE drop..."
              style={{ width: '100%', background: 'var(--gray)', border: '1px solid var(--gray-light)', borderRadius: 8, padding: '9px 12px', color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--gray-light)')} />
          </div>

          {/* Holder selector */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>
                Apply to ({selectedHolders.size} of {holders.length})
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={selectAll} style={{ fontSize: 11, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Select all</button>
                <button onClick={clearAll} style={{ fontSize: 11, color: '#555', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
              {holders.map(h => {
                const isSelected = selectedHolders.has(h.id)
                return (
                  <div key={h.id} onClick={() => toggleHolder(h.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: isSelected ? 'rgba(255,224,72,0.04)' : 'var(--gray)', border: `1px solid ${isSelected ? 'rgba(255,224,72,0.2)' : 'var(--gray-light)'}`, borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s' }}>
                    <div style={{ width: 16, height: 16, border: `1.5px solid ${isSelected ? 'var(--gold)' : 'var(--gray-light)'}`, borderRadius: 3, background: isSelected ? 'var(--gold)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                      {isSelected && <span style={{ color: '#050505', fontSize: 9, fontWeight: 900 }}>✓</span>}
                    </div>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${statusColors[h.status]}22`, border: `1px solid ${statusColors[h.status]}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: statusColors[h.status], flexShrink: 0 }}>
                      {(h.ens || h.twitter).slice(1, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{h.ens || h.twitter}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{h.twitter} · {h.nftCount} GVCs</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--gray)', display: 'flex', gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', background: 'var(--gray)', border: '1px solid var(--gray-light)', borderRadius: 10, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={logAll} disabled={selectedHolders.size === 0 || done}
            style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px', background: done ? 'rgba(46,255,46,0.1)' : 'var(--gold)', border: done ? '1px solid rgba(46,255,46,0.3)' : 'none', borderRadius: 10, color: done ? 'var(--green)' : '#050505', fontSize: 13, fontWeight: 700, cursor: selectedHolders.size === 0 ? 'default' : 'pointer', opacity: selectedHolders.size === 0 ? 0.5 : 1, transition: 'all 0.2s' }}>
            {done ? <><CheckCircle size={15} /> Logged!</> : <><Zap size={15} /> Log for {selectedHolders.size} holder{selectedHolders.size !== 1 ? 's' : ''}</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

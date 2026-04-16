'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getAllEvents, CRMEvent, EVENT_LABELS, EVENT_ICONS, TEAM_COLORS, TeamMember } from '@/lib/crm-store'
import { MOCK_HOLDERS } from '@/lib/holders'
import { Activity, Filter } from 'lucide-react'

export default function ActivityFeed() {
  const [events, setEvents] = useState<CRMEvent[]>([])
  const [filterUser, setFilterUser] = useState<TeamMember | 'all'>('all')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setEvents(getAllEvents())

    // Refresh every 30 seconds
    const interval = setInterval(() => setEvents(getAllEvents()), 30000)
    return () => clearInterval(interval)
  }, [])

  if (!mounted) return null

  const filtered = filterUser === 'all' ? events : events.filter(e => e.by === filterUser)
  const teamMembers: TeamMember[] = ['Ronny', 'Chris', 'Ty', 'Maison']

  const getHolder = (id: string) => MOCK_HOLDERS.find(h => h.id === id)

  const formatRelative = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days === 1) return 'Yesterday'
    return `${days}d ago`
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: 'var(--dark)', border: '1px solid var(--gray)', borderRadius: 16, overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={15} style={{ color: 'var(--gold)' }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Team Activity</span>
        </div>
        {/* Filter by team member */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => setFilterUser('all')} style={{
            padding: '4px 10px', borderRadius: 6, border: `1px solid ${filterUser === 'all' ? 'var(--gold)' : '#333'}`,
            background: filterUser === 'all' ? 'rgba(255,224,72,0.08)' : '#1f1f1f',
            color: filterUser === 'all' ? 'var(--gold)' : '#666', fontSize: 11, fontWeight: 600, cursor: 'pointer',
          }}>All</button>
          {teamMembers.map(m => (
            <button key={m} onClick={() => setFilterUser(m)} style={{
              padding: '4px 10px', borderRadius: 6,
              border: `1px solid ${filterUser === m ? TEAM_COLORS[m] : '#333'}`,
              background: filterUser === m ? `${TEAM_COLORS[m]}11` : '#1f1f1f',
              color: filterUser === m ? TEAM_COLORS[m] : '#666', fontSize: 11, fontWeight: 600, cursor: 'pointer',
            }}>{m}</button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            No activity logged yet
          </div>
        ) : (
          filtered.slice(0, 30).map((event, i) => {
            const holder = getHolder(event.holderId)
            return (
              <motion.div key={event.id}
                initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                style={{
                  padding: '12px 20px',
                  borderBottom: '1px solid var(--gray)',
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                }}
              >
                {/* Event icon */}
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: `${TEAM_COLORS[event.by]}11`,
                  border: `1px solid ${TEAM_COLORS[event.by]}33`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14,
                }}>
                  {EVENT_ICONS[event.type]}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    <span style={{ color: TEAM_COLORS[event.by], fontWeight: 700 }}>{event.by}</span>
                    {' · '}
                    <span style={{ color: 'var(--text-secondary)' }}>{EVENT_LABELS[event.type]}</span>
                    {holder && (
                      <span style={{ color: 'var(--text-muted)' }}> for <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{holder.twitter}</span></span>
                    )}
                  </div>
                  {event.note && (
                    <div style={{
                      marginTop: 4, fontSize: 11, color: '#555',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      maxWidth: 360,
                    }}>
                      "{event.note}"
                    </div>
                  )}
                </div>

                {/* Time */}
                <div style={{ fontSize: 11, color: '#444', flexShrink: 0, marginTop: 1 }}>
                  {formatRelative(event.timestamp)}
                </div>
              </motion.div>
            )
          })
        )}
      </div>

      {filtered.length > 30 && (
        <div style={{ padding: '10px 20px', borderTop: '1px solid var(--gray)', textAlign: 'center', fontSize: 11, color: '#444' }}>
          Showing 30 most recent · {filtered.length} total
        </div>
      )}
    </motion.div>
  )
}

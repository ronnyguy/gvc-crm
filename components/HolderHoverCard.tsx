'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Holder } from '@/lib/holders'
import {
  getEventsForHolder, getOutreachForHolder, getLockStatus,
  getCooldownForHolder, setCooldownForHolder, getNoteForHolder,
  saveNoteForHolder, getDMAngle, addEvent, EVENT_LABELS, EVENT_ICONS,
  TEAM_MEMBERS, TEAM_COLORS, EventType, TeamMember,
} from '@/lib/crm-store'
import { useToast } from './Toast'
import { Lock, Clock, Plus, Save, ChevronDown } from 'lucide-react'

interface Props {
  holder: Holder
  onAddToOutreach: (id: string) => void
  isSelected: boolean
  activeUser: TeamMember
}

const EVENT_TYPES: EventType[] = [
  'bought_oe', 'attended_space', 'retweeted', 'responded_dm',
  'discord_active', 'quest_completed', 'custom',
]

export default function HolderHoverCard({ holder, onAddToOutreach, isSelected, activeUser }: Props) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [events, setEvents] = useState(getEventsForHolder(holder.id))
  const [lockStatus, setLockStatus] = useState(getLockStatus(holder.id))
  const [cooldownDays, setCooldownDays] = useState(getCooldownForHolder(holder.id))
  const [note, setNote] = useState(getNoteForHolder(holder.id) || holder.notes)
  const [noteDirty, setNoteDirty] = useState(false)
  const [addingEvent, setAddingEvent] = useState(false)
  const [newEventType, setNewEventType] = useState<EventType>('bought_oe')
  const [newEventNote, setNewEventNote] = useState('')
  const cardRef = useRef<HTMLDivElement>(null)

  const dmAngle = getDMAngle(holder.id, holder.status, holder.vibeScore, holder.nftCount)

  useEffect(() => {
    if (!open) return
    setEvents(getEventsForHolder(holder.id))
    setLockStatus(getLockStatus(holder.id))
    setCooldownDays(getCooldownForHolder(holder.id))
    setNote(getNoteForHolder(holder.id) || holder.notes)
  }, [open, holder.id, holder.notes])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const saveNote = () => {
    saveNoteForHolder(holder.id, note)
    setNoteDirty(false)
    toast('success', 'Note saved', holder.twitter)
  }

  const saveCooldown = (days: number) => {
    setCooldownDays(days)
    setCooldownForHolder(holder.id, days)
    toast('info', `Cooldown set to ${days} days`, holder.twitter)
  }

  const logEvent = () => {
    const newEvent = addEvent({
      holderId: holder.id,
      type: newEventType,
      label: EVENT_LABELS[newEventType],
      note: newEventNote || undefined,
      by: activeUser,
    })
    setEvents(prev => [newEvent, ...prev])
    setNewEventNote('')
    setAddingEvent(false)
    toast('vibe', `Event logged`, `${EVENT_LABELS[newEventType]} · ${holder.twitter}`)
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatRelative = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    return `${days}d ago`
  }

  return (
    <div ref={cardRef} style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: 24, height: 24, borderRadius: '50%',
          border: `1px solid ${open ? 'var(--gold)' : lockStatus.locked ? '#FF6B9D44' : '#333'}`,
          background: open ? 'rgba(255,224,72,0.08)' : '#1a1a1a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: open ? 'var(--gold)' : lockStatus.locked ? '#FF6B9D' : '#555',
          fontSize: 11, fontWeight: 600, transition: 'all 0.15s', flexShrink: 0,
          position: 'relative',
        }}
        title={lockStatus.locked ? `Locked · ${lockStatus.by} reached out ${formatRelative(lockStatus.since!)}` : 'Holder info'}
      >
        {lockStatus.locked ? <Lock size={11} /> : 'i'}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', right: 0, top: 32,
              width: 320, zIndex: 200,
              background: '#161616',
              border: '1px solid #2a2a2a',
              borderRadius: 14,
              boxShadow: '0 12px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
              overflow: 'hidden',
            }}
          >
            {/* Lock banner */}
            {lockStatus.locked && (
              <div style={{
                padding: '8px 14px',
                background: 'rgba(255,107,157,0.06)',
                borderBottom: '1px solid rgba(255,107,157,0.15)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Lock size={11} style={{ color: '#FF6B9D', flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#FF6B9D' }}>
                  <strong>{lockStatus.by}</strong> reached out {formatRelative(lockStatus.since!)} · {lockStatus.daysLeft}d left
                </span>
              </div>
            )}

            {/* Header */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #222' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e0e0e0' }}>{holder.ens || holder.twitter}</div>
                <div style={{ display: 'flex', gap: 5 }}>
                  {holder.tags.slice(0, 2).map(tag => (
                    <span key={tag} style={{
                      padding: '2px 7px', borderRadius: 4,
                      background: '#1f1f1f', border: '1px solid #2a2a2a',
                      fontSize: 10, color: '#666',
                    }}>{tag}</span>
                  ))}
                </div>
              </div>

              {/* Cooldown setting */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={11} style={{ color: '#555' }} />
                <span style={{ fontSize: 11, color: '#555' }}>Cooldown:</span>
                <select
                  value={cooldownDays}
                  onChange={e => saveCooldown(Number(e.target.value))}
                  style={{
                    background: '#1f1f1f', border: '1px solid #333', borderRadius: 5,
                    color: '#888', fontSize: 11, padding: '2px 6px', cursor: 'pointer', outline: 'none',
                  }}
                >
                  {[7, 14, 21, 30, 45, 60, 90].map(d => (
                    <option key={d} value={d}>{d} days</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Scrollable body */}
            <div style={{ maxHeight: 420, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Overview / Notes */}
              <div>
                <div style={{ fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6, fontWeight: 600 }}>Overview</div>
                <textarea
                  value={note}
                  onChange={e => { setNote(e.target.value); setNoteDirty(true) }}
                  rows={3}
                  style={{
                    width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a',
                    borderRadius: 8, color: '#aaa', fontSize: 12, lineHeight: 1.5,
                    padding: '8px 10px', resize: 'none', outline: 'none', fontFamily: 'inherit',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
                />
                {noteDirty && (
                  <button onClick={saveNote} style={{
                    marginTop: 6, display: 'flex', alignItems: 'center', gap: 4,
                    padding: '4px 10px', background: 'rgba(255,224,72,0.08)',
                    border: '1px solid rgba(255,224,72,0.2)', borderRadius: 6,
                    color: 'var(--gold)', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  }}>
                    <Save size={11} /> Save note
                  </button>
                )}
              </div>

              {/* DM Angle */}
              <div>
                <div style={{ fontSize: 10, color: '#FFE048', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6, fontWeight: 600 }}>Suggested DM angle</div>
                <div style={{
                  background: '#111', border: '1px solid #2a2a2a', borderRadius: 8,
                  padding: '10px 12px', fontSize: 12, color: '#888', lineHeight: 1.6,
                }}>
                  {dmAngle}
                </div>
              </div>

              {/* Event log */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>Event history</div>
                  <button
                    onClick={() => setAddingEvent(v => !v)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '3px 8px', background: '#1f1f1f',
                      border: '1px solid #333', borderRadius: 5,
                      color: '#888', fontSize: 10, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    <Plus size={10} /> Log event
                  </button>
                </div>

                {/* Add event form */}
                <AnimatePresence>
                  {addingEvent && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ overflow: 'hidden', marginBottom: 10 }}
                    >
                      <div style={{
                        background: '#111', border: '1px solid #2a2a2a',
                        borderRadius: 8, padding: '10px 12px',
                        display: 'flex', flexDirection: 'column', gap: 8,
                      }}>
                        <select
                          value={newEventType}
                          onChange={e => setNewEventType(e.target.value as EventType)}
                          style={{
                            background: '#1f1f1f', border: '1px solid #333', borderRadius: 6,
                            color: '#aaa', fontSize: 12, padding: '6px 8px', outline: 'none', cursor: 'pointer',
                          }}
                        >
                          {EVENT_TYPES.map(t => (
                            <option key={t} value={t}>{EVENT_ICONS[t]} {EVENT_LABELS[t]}</option>
                          ))}
                        </select>
                        <input
                          value={newEventNote}
                          onChange={e => setNewEventNote(e.target.value)}
                          placeholder="Optional note..."
                          style={{
                            background: '#1f1f1f', border: '1px solid #333', borderRadius: 6,
                            color: '#aaa', fontSize: 12, padding: '6px 8px', outline: 'none',
                            fontFamily: 'inherit',
                          }}
                        />
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => setAddingEvent(false)} style={{
                            flex: 1, padding: '6px', background: '#1f1f1f', border: '1px solid #333',
                            borderRadius: 6, color: '#666', fontSize: 11, cursor: 'pointer',
                          }}>Cancel</button>
                          <button onClick={logEvent} style={{
                            flex: 1, padding: '6px', background: 'var(--gold)', border: 'none',
                            borderRadius: 6, color: '#050505', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                          }}>Log it</button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Events list */}
                {events.length === 0 ? (
                  <div style={{ fontSize: 12, color: '#333', textAlign: 'center', padding: '12px 0' }}>
                    No events logged yet
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {events.slice(0, 5).map(ev => (
                      <div key={ev.id} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 8,
                        padding: '7px 10px', background: '#111',
                        border: '1px solid #1a1a1a', borderRadius: 7,
                      }}>
                        <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>{EVENT_ICONS[ev.type]}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, color: '#aaa', fontWeight: 500 }}>{ev.label}</div>
                          {ev.note && <div style={{ fontSize: 10, color: '#555', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.note}</div>}
                        </div>
                        <div style={{ flexShrink: 0, textAlign: 'right' }}>
                          <div style={{ fontSize: 10, color: TEAM_COLORS[ev.by], fontWeight: 600 }}>{ev.by}</div>
                          <div style={{ fontSize: 10, color: '#333' }}>{formatRelative(ev.timestamp)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '12px 16px', borderTop: '1px solid #222',
              display: 'flex', gap: 8,
            }}>
              <button
                onClick={() => { onAddToOutreach(holder.id); setOpen(false) }}
                style={{
                  flex: 1, padding: '8px',
                  background: isSelected ? 'rgba(46,255,46,0.08)' : 'var(--gold)',
                  border: isSelected ? '1px solid rgba(46,255,46,0.2)' : 'none',
                  borderRadius: 8,
                  color: isSelected ? 'var(--green)' : '#050505',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {isSelected ? '✓ In outreach' : '+ Add to outreach'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

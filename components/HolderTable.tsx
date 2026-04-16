'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Holder } from '@/lib/holders'
import { shortenWallet } from '@/lib/contract'
import { getLockStatus, LockStatus, TeamMember, TEAM_COLORS } from '@/lib/crm-store'
import HolderHoverCard from './HolderHoverCard'
import { MessageCircle, Wallet, ChevronUp, ChevronDown, Copy, Check, Hash } from 'lucide-react'
import { useToast } from './Toast'

interface Props {
  holders: Holder[]
  selected: string[]
  onToggleSelect: (id: string) => void
  filter: 'all' | 'active' | 'inactive' | 'new'
  activeUser: TeamMember
}

type SortKey = 'vibeScore' | 'nftCount' | 'lastSeen' | 'joinedDate'

const statusConfig = {
  active: { label: 'Active', color: '#2EFF2E', bg: 'rgba(46,255,46,0.08)' },
  inactive: { label: 'Inactive', color: '#555555', bg: 'rgba(85,85,85,0.08)' },
  new: { label: 'New', color: '#FFE048', bg: 'rgba(255,224,72,0.08)' },
}

export default function HolderTable({ holders, selected, onToggleSelect, filter, activeUser }: Props) {
  const { toast } = useToast()
  const [sort, setSort] = useState<SortKey>('vibeScore')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [copied, setCopied] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [lockStatuses, setLockStatuses] = useState<Record<string, LockStatus>>({})

  useEffect(() => {
    setMounted(true)
    const statuses: Record<string, LockStatus> = {}
    holders.forEach(h => { statuses[h.id] = getLockStatus(h.id) })
    setLockStatuses(statuses)
  }, [holders])

  const filtered = holders.filter(h => filter === 'all' || h.status === filter)
  const sorted = [...filtered].sort((a, b) => {
    let aVal: number | string = a[sort]
    let bVal: number | string = b[sort]
    if (sort === 'lastSeen' || sort === 'joinedDate') {
      aVal = new Date(aVal).getTime()
      bVal = new Date(bVal).getTime()
    }
    return sortDir === 'desc' ? (bVal as number) - (aVal as number) : (aVal as number) - (bVal as number)
  })

  const toggleSort = (key: SortKey) => {
    if (sort === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSort(key); setSortDir('desc') }
  }

  const copyWallet = async (wallet: string) => {
    await navigator.clipboard.writeText(wallet)
    setCopied(wallet)
    toast('success', 'Wallet copied', shortenWallet(wallet))
    setTimeout(() => setCopied(null), 2000)
  }

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sort !== k) return <ChevronUp size={12} style={{ opacity: 0.2 }} />
    return sortDir === 'desc' ? <ChevronDown size={12} style={{ color: 'var(--gold)' }} /> : <ChevronUp size={12} style={{ color: 'var(--gold)' }} />
  }

  const ColHeader = ({ k, label }: { k: SortKey; label: string }) => (
    <th onClick={() => toggleSort(k)} style={{
      padding: '10px 16px', textAlign: 'right',
      color: sort === k ? 'var(--gold)' : 'var(--text-muted)',
      fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
      cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
    }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {label} <SortIcon k={k} />
      </span>
    </th>
  )

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--gray)' }}>
            <th style={{ width: 40, padding: '10px 16px' }}></th>
            <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Holder</th>
            <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Status</th>
            <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Socials</th>
            <ColHeader k="nftCount" label="GVCs" />
            <ColHeader k="vibeScore" label="Vibe Score" />
            <ColHeader k="lastSeen" label="Last Seen" />
            <th style={{ padding: '10px 16px', width: 40 }}></th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence>
            {sorted.map((h, i) => {
              const isSelected = selected.includes(h.id)
              const sc = statusConfig[h.status]
              const lock = (mounted ? lockStatuses[h.id] : null) || { locked: false }

              return (
                <motion.tr
                  key={h.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => onToggleSelect(h.id)}
                  style={{
                    borderBottom: '1px solid var(--gray)',
                    background: isSelected ? 'rgba(255,224,72,0.04)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                    opacity: lock.locked ? 0.75 : 1,
                  }}
                  onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isSelected ? 'rgba(255,224,72,0.04)' : 'transparent' }}
                >
                  {/* Checkbox */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{
                      width: 18, height: 18,
                      border: `1.5px solid ${isSelected ? 'var(--gold)' : lock.locked ? '#FF6B9D44' : 'var(--gray-light)'}`,
                      borderRadius: 4,
                      background: isSelected ? 'var(--gold)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s ease', flexShrink: 0,
                    }}>
                      {isSelected && <Check size={11} color="#050505" strokeWidth={3} />}
                    </div>
                  </td>

                  {/* Holder */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: `linear-gradient(135deg, ${sc.color}22, ${sc.color}44)`,
                          border: `1px solid ${sc.color}44`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 700, color: sc.color, flexShrink: 0,
                        }}>
                          {(h.ens || h.twitter).slice(1, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>
                            {h.ens || h.twitter}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 11 }}>
                            <Wallet size={10} />
                            <span>{shortenWallet(h.wallet)}</span>
                            <button onClick={e => { e.stopPropagation(); copyWallet(h.wallet) }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-muted)', display: 'flex' }}>
                              {copied === h.wallet ? <Check size={10} style={{ color: 'var(--green)' }} /> : <Copy size={10} />}
                            </button>
                          </div>
                        </div>
                      </div>
                      {h.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', paddingLeft: 40 }}>
                          {h.tags.slice(0, 2).map(tag => (
                            <span key={tag} style={{ fontSize: 10, padding: '2px 6px', background: 'var(--gray)', borderRadius: 4, color: 'var(--text-muted)', fontWeight: 500 }}>{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '4px 10px', borderRadius: 20,
                      background: sc.bg, border: `1px solid ${sc.color}33`,
                      fontSize: 11, fontWeight: 600, color: sc.color,
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: sc.color, boxShadow: h.status === 'active' ? `0 0 4px ${sc.color}` : 'none' }} />
                      {sc.label}
                    </span>
                  </td>

                  {/* Socials */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <a href={`https://twitter.com/${h.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)', fontSize: 12, textDecoration: 'none', transition: 'color 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>
                        <span style={{ fontSize: 11 }}>𝕏</span>
                        <span style={{ maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.twitter}</span>
                      </a>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 11 }}>
                        <MessageCircle size={11} />{h.discord.split('#')[0]}
                      </span>
                    </div>
                  </td>

                  {/* NFT count */}
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: h.nftCount >= 3 ? 'var(--gold)' : 'var(--text-primary)', fontSize: 14, fontWeight: 700 }}>
                      <Hash size={12} style={{ opacity: 0.5 }} />{h.nftCount}
                    </span>
                  </td>

                  {/* Vibe Score */}
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: h.vibeScore >= 70 ? 'var(--gold)' : h.vibeScore >= 40 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {h.vibeScore}
                      </span>
                      <div style={{ width: 60, height: 3, background: 'var(--gray)', borderRadius: 2 }}>
                        <div style={{ width: `${h.vibeScore}%`, height: '100%', background: h.vibeScore >= 70 ? 'var(--gold)' : h.vibeScore >= 40 ? 'var(--text-secondary)' : 'var(--text-muted)', borderRadius: 2 }} />
                      </div>
                    </div>
                  </td>

                  {/* Last seen */}
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                        {new Date(h.lastSeen).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      {lock.locked && (
                        <span style={{ fontSize: 10, color: TEAM_COLORS[lock.by!], fontWeight: 600 }}>
                          {lock.by} · {lock.daysLeft}d left
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Info card trigger */}
                  <td style={{ padding: '14px 16px' }} onClick={e => e.stopPropagation()}>
                    <HolderHoverCard
                      holder={h}
                      onAddToOutreach={onToggleSelect}
                      isSelected={isSelected}
                      activeUser={activeUser}
                    />
                  </td>
                </motion.tr>
              )
            })}
          </AnimatePresence>
        </tbody>
      </table>
      {sorted.length === 0 && (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)', fontSize: 14 }}>No holders match this filter</div>
      )}
    </div>
  )
}

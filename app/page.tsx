'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MOCK_HOLDERS } from '@/lib/holders'
import { TeamMember, seedDemoData, TEAM_COLORS, TEAM_MEMBERS } from '@/lib/crm-store'
import HolderTable from '@/components/HolderTable'
import StatsBar from '@/components/StatsBar'
import OutreachPanel from '@/components/OutreachPanel'
import BlockchainLookup from '@/components/BlockchainLookup'
import NeedsAttention from '@/components/NeedsAttention'
import ActivityFeed from '@/components/ActivityFeed'
import BulkEventModal from '@/components/BulkEventModal'
import { useToast } from '@/components/Toast'
import { Search, Zap, Users, TrendingUp, TrendingDown, Sparkles, X, Link2, AlertCircle, Activity, LayoutGrid } from 'lucide-react'

type FilterType = 'all' | 'active' | 'inactive' | 'new'
type ViewType = 'hub' | 'attention' | 'activity'

export default function Dashboard() {
  const { toast } = useToast()
  const [view, setView] = useState<ViewType>('hub')
  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [showOutreach, setShowOutreach] = useState(false)
  const [showLookup, setShowLookup] = useState(false)
  const [showBulkEvent, setShowBulkEvent] = useState(false)
  const [activeUser, setActiveUser] = useState<TeamMember>('Ronny')

  useEffect(() => { seedDemoData() }, [])

  const filtered = useMemo(() => {
    return MOCK_HOLDERS.filter(h => {
      const matchFilter = filter === 'all' || h.status === filter
      const q = search.toLowerCase()
      const matchSearch = !q || (
        h.twitter.toLowerCase().includes(q) ||
        h.discord.toLowerCase().includes(q) ||
        h.wallet.toLowerCase().includes(q) ||
        (h.ens?.toLowerCase().includes(q) ?? false) ||
        h.tags.some(t => t.toLowerCase().includes(q))
      )
      return matchFilter && matchSearch
    })
  }, [filter, search])

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const selectedHolders = MOCK_HOLDERS.filter(h => selected.includes(h.id))
  const activeSelected = selectedHolders.filter(h => h.status === 'active')
  const inactiveSelected = selectedHolders.filter(h => h.status === 'inactive' || h.status === 'new')

  const autoSelect = () => {
    const actives = MOCK_HOLDERS.filter(h => h.status === 'active').sort((a, b) => b.vibeScore - a.vibeScore).slice(0, 3)
    const inactives = MOCK_HOLDERS.filter(h => h.status === 'inactive').sort((a, b) => a.vibeScore - b.vibeScore).slice(0, 3)
    setSelected([...actives, ...inactives].map(h => h.id))
    toast('vibe', 'Auto-selected 6 holders', '3 active · 3 inactive — ready for outreach')
  }

  const filterTabs = [
    { key: 'all' as FilterType, label: 'All', icon: <Users size={13} /> },
    { key: 'active' as FilterType, label: 'Active', icon: <TrendingUp size={13} /> },
    { key: 'inactive' as FilterType, label: 'Inactive', icon: <TrendingDown size={13} /> },
    { key: 'new' as FilterType, label: 'New', icon: <Sparkles size={13} /> },
  ]

  const navViews = [
    { key: 'hub' as ViewType, label: 'Holder Hub', icon: <LayoutGrid size={14} /> },
    { key: 'attention' as ViewType, label: 'Needs Attention', icon: <AlertCircle size={14} /> },
    { key: 'activity' as ViewType, label: 'Activity Feed', icon: <Activity size={14} /> },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', paddingBottom: 80 }}>
      {/* Nav */}
      <div style={{ borderBottom: '1px solid var(--gray)', background: 'rgba(18,18,18,0.95)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, background: 'var(--gold)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 15 }}>🤙</span>
            </div>
            <div>
              <div className="font-brice shimmer-gold" style={{ fontSize: 14 }}>GVC CRM</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: -2 }}>Holder Hub</div>
            </div>
          </div>

          {/* View nav */}
          <div style={{ display: 'flex', gap: 2 }}>
            {navViews.map(v => (
              <button key={v.key} onClick={() => setView(v.key)} style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, border: 'none',
                background: view === v.key ? 'rgba(255,224,72,0.1)' : 'transparent',
                color: view === v.key ? 'var(--gold)' : 'var(--text-muted)',
                fontSize: 12, fontWeight: view === v.key ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s',
              }}>
                {v.icon} {v.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Active user */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: 'var(--gray)', border: '1px solid var(--gray-light)', borderRadius: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: TEAM_COLORS[activeUser], boxShadow: `0 0 5px ${TEAM_COLORS[activeUser]}` }} />
            <select value={activeUser} onChange={e => setActiveUser(e.target.value as TeamMember)}
              style={{ background: 'transparent', border: 'none', color: TEAM_COLORS[activeUser], fontSize: 12, fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
              {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <button onClick={() => setShowLookup(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'var(--gray)', border: '1px solid var(--gray-light)', borderRadius: 8, color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--gold)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray-light)'; e.currentTarget.style.color = 'var(--text-secondary)' }}>
            <Link2 size={13} /> Wallet lookup
          </button>

          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{MOCK_HOLDERS.length}</span> holders
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Page header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-brice shimmer-gold" style={{ fontSize: 32, marginBottom: 4 }}>
            {view === 'hub' && 'Holder Hub'}
            {view === 'attention' && 'Needs Attention'}
            {view === 'activity' && 'Team Activity'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            {view === 'hub' && 'Your GVC community at a glance. Select holders to start outreach.'}
            {view === 'attention' && 'Holders overdue for outreach, sorted by urgency.'}
            {view === 'activity' && 'Everything the team has logged across all holders.'}
          </p>
        </motion.div>

        {/* Stats — always visible */}
        <StatsBar holders={MOCK_HOLDERS} />

        {/* Hub view */}
        {view === 'hub' && (
          <>
            {/* Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 3, background: 'var(--dark)', border: '1px solid var(--gray)', borderRadius: 10, padding: 3 }}>
                {filterTabs.map(tab => (
                  <button key={tab.key} onClick={() => setFilter(tab.key)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, border: 'none', background: filter === tab.key ? 'var(--gold)' : 'transparent', color: filter === tab.key ? 'var(--black)' : 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
                <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search holders..."
                  style={{ width: '100%', background: 'var(--dark)', border: '1px solid var(--gray)', borderRadius: 9, padding: '7px 11px 7px 32px', color: 'var(--text-primary)', fontSize: 12, outline: 'none', transition: 'border-color 0.15s' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--gray)')} />
              </div>

              <button onClick={autoSelect} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: 'var(--gray)', border: '1px solid var(--gray-light)', borderRadius: 9, color: 'var(--text-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--gold)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray-light)'; e.currentTarget.style.color = 'var(--text-primary)' }}>
                <Zap size={12} /> Auto-select 3+3
              </button>

              <button onClick={() => setShowBulkEvent(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: 'var(--gray)', border: '1px solid var(--gray-light)', borderRadius: 9, color: 'var(--text-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--gold)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray-light)'; e.currentTarget.style.color = 'var(--text-primary)' }}>
                <Sparkles size={12} /> Bulk Log Event
              </button>
            </div>

            {/* Table */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              style={{ background: 'var(--dark)', border: '1px solid var(--gray)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--gray)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {filtered.length} holder{filtered.length !== 1 ? 's' : ''}
                  {selected.length > 0 && <span style={{ color: 'var(--gold)', marginLeft: 8, fontWeight: 600 }}>· {selected.length} selected</span>}
                </span>
                {selected.length > 0 && (
                  <button onClick={() => setSelected([])} style={{ fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <X size={11} /> Clear
                  </button>
                )}
              </div>
              <HolderTable holders={filtered} selected={selected} onToggleSelect={toggleSelect} filter={filter} activeUser={activeUser} />
            </motion.div>
          </>
        )}

        {/* Needs Attention view */}
        {view === 'attention' && (
          <NeedsAttention
            holders={MOCK_HOLDERS}
            selected={selected}
            onToggleSelect={toggleSelect}
            onOpenOutreach={() => setShowOutreach(true)}
          />
        )}

        {/* Activity Feed view */}
        {view === 'activity' && <ActivityFeed />}
      </div>

      {/* Outreach bar */}
      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(18,18,18,0.97)', borderTop: '1px solid var(--gold)', boxShadow: '0 -4px 40px rgba(255,224,72,0.12)', backdropFilter: 'blur(12px)', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 60 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--gold)', boxShadow: '0 0 8px var(--gold)' }} />
              <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{selected.length} selected</span>
              <div style={{ display: 'flex', gap: 5 }}>
                {activeSelected.length > 0 && <span style={{ padding: '2px 8px', borderRadius: 20, background: 'rgba(46,255,46,0.08)', border: '1px solid rgba(46,255,46,0.2)', color: 'var(--green)', fontSize: 10, fontWeight: 600 }}>{activeSelected.length} active</span>}
                {inactiveSelected.length > 0 && <span style={{ padding: '2px 8px', borderRadius: 20, background: 'rgba(85,85,85,0.08)', border: '1px solid rgba(85,85,85,0.2)', color: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }}>{inactiveSelected.length} inactive</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setSelected([])} style={{ padding: '7px 14px', background: 'var(--gray)', border: '1px solid var(--gray-light)', borderRadius: 9, color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Clear</button>
              <button onClick={() => setShowOutreach(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 18px', background: 'var(--gold)', color: '#050505', border: 'none', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                <Zap size={14} /> Open Outreach Studio
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showOutreach && <OutreachPanel holders={selectedHolders} allHolders={MOCK_HOLDERS} onClose={() => setShowOutreach(false)} activeUser={activeUser} onActiveUserChange={setActiveUser} />}
      </AnimatePresence>
      <AnimatePresence>
        {showLookup && <BlockchainLookup onClose={() => setShowLookup(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showBulkEvent && (
          <BulkEventModal
            holders={MOCK_HOLDERS}
            activeUser={activeUser}
            onClose={() => setShowBulkEvent(false)}
            onComplete={() => toast('vibe', 'Events logged', 'Activity feed updated')}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

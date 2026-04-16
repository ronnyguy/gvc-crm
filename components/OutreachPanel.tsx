'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Holder, GVC_GIFS } from '@/lib/holders'
import { logOutreach, TEAM_MEMBERS, TEAM_COLORS, TeamMember } from '@/lib/crm-store'
import {
  getTemplatesForUser, saveTemplatesForUser, resetTemplatesForUser,
  getAllVisibleTemplates, getEnabledBorrowedIds, toggleBorrowedTemplate,
  DMTemplate, CATEGORY_LABELS, CATEGORY_ORDER
} from '@/lib/templates'
import { X, Copy, Check, Sparkles, ExternalLink, CheckCircle, Pencil, RotateCcw, ChevronDown } from 'lucide-react'
import { useToast } from './Toast'

interface Props {
  holders: Holder[]
  allHolders: Holder[]
  onClose: () => void
  activeUser: TeamMember
  onActiveUserChange: (u: TeamMember) => void
}

interface TemplateSelection {
  categoryId: DMTemplate['category'] | ''
  templateId: string
}

export default function OutreachPanel({ holders, allHolders, onClose, activeUser, onActiveUserChange }: Props) {
  const { toast } = useToast()
  const [selectedGif, setSelectedGif] = useState(GVC_GIFS[0])
  const [myTemplates, setMyTemplates] = useState<DMTemplate[]>([])
  const [selection, setSelection] = useState<Record<string, TemplateSelection>>({})
  const [dmMessages, setDmMessages] = useState<Record<string, string>>({})
  const [postUrls, setPostUrls] = useState<Record<string, string>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [sentIds, setSentIds] = useState<Set<string>>(new Set())
  const [twitterOpenedIds, setTwitterOpenedIds] = useState<Set<string>>(new Set())
  const [showTemplateManager, setShowTemplateManager] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingBody, setEditingBody] = useState('')
  const [enabledBorrowed, setEnabledBorrowed] = useState<Set<string>>(new Set())
  const [borrowedTab, setBorrowedTab] = useState<TeamMember | null>(null)

  useEffect(() => {
    const templates = getTemplatesForUser(activeUser)
    setMyTemplates(templates)
    setEnabledBorrowed(getEnabledBorrowedIds(activeUser))
  }, [activeUser])

  // Group my templates by category
  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    const tmpls = myTemplates.filter(t => t.category === cat)
    if (tmpls.length > 0) acc[cat] = tmpls
    return acc
  }, {} as Record<string, DMTemplate[]>)

  const buildMessage = (tpl: DMTemplate, holder: Holder, postUrl: string) =>
    tpl.body.replace(/{name}/g, holder.twitter).replace(/{postUrl}/g, postUrl || '[paste tweet link here]')

  const applyCategory = (holderId: string, categoryId: DMTemplate['category'], holder: Holder) => {
    const templates = grouped[categoryId] || []
    const firstTpl = templates[0]
    if (!firstTpl) return
    setSelection(prev => ({ ...prev, [holderId]: { categoryId, templateId: firstTpl.id } }))
    setDmMessages(prev => ({ ...prev, [holderId]: buildMessage(firstTpl, holder, postUrls[holderId] || '') }))
  }

  const applyTemplate = (holderId: string, templateId: string, holder: Holder) => {
    const tpl = myTemplates.find(t => t.id === templateId)
    if (!tpl) return
    setSelection(prev => ({ ...prev, [holderId]: { ...prev[holderId], templateId } }))
    setDmMessages(prev => ({ ...prev, [holderId]: buildMessage(tpl, holder, postUrls[holderId] || '') }))
  }

  const updatePostUrl = (holderId: string, url: string, holder: Holder) => {
    setPostUrls(prev => ({ ...prev, [holderId]: url }))
    const sel = selection[holderId]
    if (!sel) return
    const tpl = myTemplates.find(t => t.id === sel.templateId)
    if (tpl?.hasPostUrl) setDmMessages(prev => ({ ...prev, [holderId]: buildMessage(tpl, holder, url) }))
  }

  const saveTemplateEdit = (id: string) => {
    const updated = myTemplates.map(t => t.id === id ? { ...t, body: editingBody } : t)
    setMyTemplates(updated)
    saveTemplatesForUser(activeUser, updated)
    holders.forEach(h => {
      if (selection[h.id]?.templateId === id) {
        const tpl = updated.find(t => t.id === id)!
        setDmMessages(prev => ({ ...prev, [h.id]: buildMessage(tpl, h, postUrls[h.id] || '') }))
      }
    })
    setEditingId(null)
    toast('success', 'Template saved', `${activeUser}'s templates updated`)
  }

  const handleToggleBorrowed = (fromUser: TeamMember, tpl: DMTemplate, enable: boolean) => {
    const key = `${fromUser}::${tpl.id}`
    toggleBorrowedTemplate(activeUser, tpl.id, enable)
    const next = new Set(enabledBorrowed)
    if (enable) {
      next.add(key)
      // Add to my templates list
      const borrowed = { ...tpl, id: key, label: `${tpl.label} (${fromUser})` }
      const updated = [...myTemplates, borrowed]
      setMyTemplates(updated)
      saveTemplatesForUser(activeUser, updated)
      toast('vibe', 'Template added', `${tpl.label} from ${fromUser}`)
    } else {
      next.delete(key)
      const updated = myTemplates.filter(t => t.id !== key)
      setMyTemplates(updated)
      saveTemplatesForUser(activeUser, updated)
    }
    setEnabledBorrowed(next)
  }

  const copyDM = async (holderId: string, holder: Holder) => {
    await navigator.clipboard.writeText(dmMessages[holderId] || '')
    setCopiedId(holderId)
    toast('success', `Copied for ${holder.twitter}`, 'Ready to paste')
    setTimeout(() => setCopiedId(null), 2500)
  }

  const openInTwitter = (holder: Holder) => {
    window.open(`https://twitter.com/messages/compose?recipient_id=${holder.twitter.replace('@', '')}`, '_blank')
    setTwitterOpenedIds(prev => new Set([...prev, holder.id]))
    toast('info', 'Opened Twitter DM', `${holder.twitter} · paste your message`)
  }

  const markAsSent = (holder: Holder) => {
    logOutreach({ holderId: holder.id, by: activeUser, message: dmMessages[holder.id] || '', gifUrl: selectedGif?.url || '', twitterOpened: twitterOpenedIds.has(holder.id) })
    setSentIds(prev => new Set([...prev, holder.id]))
    toast('vibe', 'Logged!', `${holder.twitter} · cooldown started`)
  }

  const statusColors: Record<string, string> = { active: 'var(--green)', inactive: 'var(--text-muted)', new: 'var(--gold)' }
  const allSent = holders.length > 0 && holders.every(h => sentIds.has(h.id))
  const otherUsers = TEAM_MEMBERS.filter(m => m !== activeUser)

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{ background: 'var(--dark)', border: '1px solid var(--gray)', borderRadius: 20, width: '100%', maxWidth: 960, maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 0 60px rgba(255,224,72,0.08), 0 32px 80px rgba(0,0,0,0.6)' }}
      >
        {/* Header */}
        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--gray)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={16} style={{ color: 'var(--gold)' }} />
            <div>
              <span className="font-brice" style={{ fontSize: 16, color: 'var(--gold)' }}>Outreach Studio</span>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 1 }}>{holders.length} holder{holders.length !== 1 ? 's' : ''} · {sentIds.size} sent</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: 'var(--gray)', border: '1px solid var(--gray-light)', borderRadius: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: TEAM_COLORS[activeUser], boxShadow: `0 0 5px ${TEAM_COLORS[activeUser]}` }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Sending as</span>
              <select value={activeUser} onChange={e => onActiveUserChange(e.target.value as TeamMember)}
                style={{ background: 'transparent', border: 'none', color: TEAM_COLORS[activeUser], fontSize: 12, fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
                {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <button onClick={() => setShowTemplateManager(v => !v)} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
              background: showTemplateManager ? 'rgba(255,224,72,0.08)' : 'var(--gray)',
              border: `1px solid ${showTemplateManager ? 'rgba(255,224,72,0.3)' : 'var(--gray-light)'}`,
              borderRadius: 8, color: showTemplateManager ? 'var(--gold)' : 'var(--text-secondary)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
            }}>
              <Pencil size={12} /> My Templates
            </button>
            <button onClick={onClose} style={{ width: 32, height: 32, background: 'var(--gray)', border: 'none', borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={14} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Template manager sidebar */}
          <AnimatePresence>
            {showTemplateManager && (
              <motion.div
                initial={{ width: 0, opacity: 0 }} animate={{ width: 300, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                style={{ borderRight: '1px solid var(--gray)', overflowY: 'auto', flexShrink: 0, background: 'var(--black)' }}
              >
                <div style={{ padding: '14px 16px' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      <span style={{ color: TEAM_COLORS[activeUser], fontWeight: 700 }}>{activeUser}'s</span> templates
                    </div>
                    <button onClick={() => { resetTemplatesForUser(activeUser); setMyTemplates(getTemplatesForUser(activeUser)); setEnabledBorrowed(new Set()); toast('info', 'Reset', `${activeUser}'s templates restored`) }}
                      style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 7px', background: '#1f1f1f', border: '1px solid #333', borderRadius: 5, color: '#555', fontSize: 10, cursor: 'pointer' }}>
                      <RotateCcw size={9} /> Reset
                    </button>
                  </div>
                  <div style={{ fontSize: 10, color: '#333', marginBottom: 14 }}>Changes only affect your profile</div>

                  {/* My templates */}
                  {CATEGORY_ORDER.map(cat => {
                    const tmpls = myTemplates.filter(t => t.category === cat)
                    if (tmpls.length === 0) return null
                    return (
                      <div key={cat} style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 8 }}>{CATEGORY_LABELS[cat]}</div>
                        {tmpls.map(tpl => (
                          <div key={tpl.id} style={{ marginBottom: 8 }}>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 4 }}>{tpl.label}</div>
                            {editingId === tpl.id ? (
                              <div>
                                <textarea value={editingBody} onChange={e => setEditingBody(e.target.value)} rows={3}
                                  style={{ width: '100%', background: '#1a1a1a', border: '1px solid var(--gold)', borderRadius: 7, color: 'var(--text-primary)', fontSize: 11, lineHeight: 1.5, padding: '7px 9px', resize: 'none', outline: 'none', fontFamily: 'inherit' }} />
                                {tpl.hasPostUrl && <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>Use {'{postUrl}'} for the tweet link</div>}
                                <div style={{ display: 'flex', gap: 5, marginTop: 5 }}>
                                  <button onClick={() => setEditingId(null)} style={{ flex: 1, padding: '5px', background: '#1f1f1f', border: '1px solid #333', borderRadius: 6, color: '#666', fontSize: 10, cursor: 'pointer' }}>Cancel</button>
                                  <button onClick={() => saveTemplateEdit(tpl.id)} style={{ flex: 1, padding: '5px', background: 'var(--gold)', border: 'none', borderRadius: 6, color: '#050505', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Save</button>
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: 5, alignItems: 'flex-start' }}>
                                <div style={{ flex: 1, background: '#1a1a1a', border: '1px solid #222', borderRadius: 7, padding: '7px 9px', fontSize: 11, color: '#666', lineHeight: 1.5 }}>{tpl.body}</div>
                                <button onClick={() => { setEditingId(tpl.id); setEditingBody(tpl.body) }}
                                  style={{ padding: '6px', background: '#1f1f1f', border: '1px solid #333', borderRadius: 6, color: '#555', cursor: 'pointer', display: 'flex', flexShrink: 0 }}>
                                  <Pencil size={11} />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )
                  })}

                  {/* Divider */}
                  <div style={{ borderTop: '1px solid #222', margin: '16px 0' }} />

                  {/* Browse other profiles */}
                  <div style={{ fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 10 }}>Browse team templates</div>
                  <div style={{ display: 'flex', gap: 5, marginBottom: 12 }}>
                    {otherUsers.map(u => (
                      <button key={u} onClick={() => setBorrowedTab(borrowedTab === u ? null : u)}
                        style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${borrowedTab === u ? TEAM_COLORS[u] : '#333'}`, background: borrowedTab === u ? `${TEAM_COLORS[u]}11` : '#1f1f1f', color: borrowedTab === u ? TEAM_COLORS[u] : '#666', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
                        {u}
                      </button>
                    ))}
                  </div>

                  {borrowedTab && (
                    <div>
                      {CATEGORY_ORDER.map(cat => {
                        const tmpls = getTemplatesForUser(borrowedTab).filter(t => t.category === cat)
                        if (tmpls.length === 0) return null
                        return (
                          <div key={cat} style={{ marginBottom: 14 }}>
                            <div style={{ fontSize: 10, color: '#333', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 6 }}>{CATEGORY_LABELS[cat]}</div>
                            {tmpls.map(tpl => {
                              const borrowKey = `${borrowedTab}::${tpl.id}`
                              const isEnabled = enabledBorrowed.has(borrowKey)
                              return (
                                <div key={tpl.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8, opacity: isEnabled ? 1 : 0.5 }}>
                                  <input type="checkbox" checked={isEnabled}
                                    onChange={e => handleToggleBorrowed(borrowedTab, tpl, e.target.checked)}
                                    style={{ marginTop: 3, accentColor: TEAM_COLORS[borrowedTab], flexShrink: 0, cursor: 'pointer' }} />
                                  <div style={{ flex: 1, background: '#1a1a1a', border: '1px solid #1f1f1f', borderRadius: 7, padding: '7px 9px', fontSize: 11, color: isEnabled ? '#888' : '#444', lineHeight: 1.5 }}>
                                    <div style={{ fontSize: 10, color: isEnabled ? TEAM_COLORS[borrowedTab] : '#333', fontWeight: 600, marginBottom: 3 }}>{tpl.label}</div>
                                    {tpl.body}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main panel */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* GIF picker */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--gray)', background: 'var(--black)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>GIF to attach</div>
                <div style={{ fontSize: 10, color: '#444' }}>{GVC_GIFS.length} GIFs</div>
              </div>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }}>
                {gifsLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} style={{ width: 64, height: 80, background: 'var(--gray)', borderRadius: 9, flexShrink: 0, opacity: 0.4 }} />
                  ))
                ) : (
                  allGifs.map(gif => (
                    <button key={gif.id} onClick={() => setSelectedGif(gif)} style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '6px 8px',
                      background: selectedGif?.id === gif.id ? 'rgba(255,224,72,0.08)' : 'var(--gray)',
                      border: `1.5px solid ${selectedGif?.id === gif.id ? 'var(--gold)' : 'transparent'}`,
                      borderRadius: 9, cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
                    }}>
                      <img src={gif.preview} alt={gif.title} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 5 }} />
                      <span style={{ fontSize: 9, color: selectedGif?.id === gif.id ? 'var(--gold)' : 'var(--text-muted)', whiteSpace: 'nowrap', maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis' }}>{gif.title}</span>
                    </button>
                  ))}
              </div>
            </div>

            {/* DM cards */}
            <div style={{ overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {holders.map((holder, i) => {
                const isCopied = copiedId === holder.id
                const isSent = sentIds.has(holder.id)
                const twitterOpened = twitterOpenedIds.has(holder.id)
                const sel = selection[holder.id] || { categoryId: '', templateId: '' }
                const categoryTemplates = sel.categoryId ? (grouped[sel.categoryId] || []) : []
                const currentTpl = myTemplates.find(t => t.id === sel.templateId)

                return (
                  <motion.div key={holder.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    style={{ background: isSent ? 'rgba(46,255,46,0.03)' : 'var(--card)', border: `1px solid ${isSent ? 'rgba(46,255,46,0.2)' : 'var(--gray)'}`, borderRadius: 12, overflow: 'hidden' }}>

                    {/* Card header */}
                    <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--gray)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: `${statusColors[holder.status]}22`, border: `1px solid ${statusColors[holder.status]}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: statusColors[holder.status] }}>
                          {holder.twitter.slice(1, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{holder.twitter}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{holder.nftCount} GVC{holder.nftCount !== 1 ? 's' : ''} · {holder.status}</div>
                        </div>
                      </div>

                      {/* Two-level selector */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {isSent && <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--green)', fontWeight: 600 }}><CheckCircle size={12} /> Sent</span>}
                        {/* Category */}
                        <select value={sel.categoryId} onChange={e => applyCategory(holder.id, e.target.value as DMTemplate['category'], holder)}
                          style={{ background: 'var(--gray)', border: '1px solid var(--gray-light)', borderRadius: 6, color: sel.categoryId ? 'var(--gold)' : 'var(--text-muted)', fontSize: 11, padding: '5px 8px', cursor: 'pointer', outline: 'none', fontWeight: sel.categoryId ? 600 : 400 }}>
                          <option value="">Select type...</option>
                          {CATEGORY_ORDER.map(cat => grouped[cat] && <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>)}
                        </select>
                        {/* Message within category */}
                        {categoryTemplates.length > 1 && (
                          <select value={sel.templateId} onChange={e => applyTemplate(holder.id, e.target.value, holder)}
                            style={{ background: 'var(--gray)', border: '1px solid var(--gray-light)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: 11, padding: '5px 8px', cursor: 'pointer', outline: 'none' }}>
                            {categoryTemplates.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                          </select>
                        )}
                      </div>
                    </div>

                    {/* Post URL input */}
                    {currentTpl?.hasPostUrl && (
                      <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--gray)', background: 'rgba(255,224,72,0.03)' }}>
                        <input value={postUrls[holder.id] || ''} onChange={e => updatePostUrl(holder.id, e.target.value, holder)}
                          placeholder="Paste tweet URL here..."
                          style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 6, padding: '6px 10px', color: 'var(--text-primary)', fontSize: 11, outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
                          onFocus={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
                          onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')} />
                      </div>
                    )}

                    {/* Message */}
                    <div style={{ padding: '12px 16px', display: 'flex', gap: 12 }}>
                      <img src={selectedGif?.url || ''} alt={selectedGif?.title || 'GIF'} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 7, border: '1px solid var(--gray)', flexShrink: 0 }} />
                      <textarea value={dmMessages[holder.id] || ''} onChange={e => setDmMessages(prev => ({ ...prev, [holder.id]: e.target.value }))}
                        placeholder="Select a message type above to populate..."
                        rows={4} style={{ flex: 1, background: 'var(--gray)', border: '1px solid var(--gray-light)', borderRadius: 7, color: 'var(--text-primary)', fontSize: 12, lineHeight: 1.6, padding: '8px 11px', resize: 'vertical', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
                        onFocus={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
                        onBlur={e => (e.currentTarget.style.borderColor = 'var(--gray-light)')} />
                    </div>

                    {/* Footer */}
                    <div style={{ padding: '8px 16px', borderTop: '1px solid var(--gray)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{(dmMessages[holder.id] || '').length} chars</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => copyDM(holder.id, holder)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: isCopied ? 'rgba(46,255,46,0.1)' : 'var(--gray)', border: `1px solid ${isCopied ? 'var(--green)' : 'var(--gray-light)'}`, borderRadius: 6, color: isCopied ? 'var(--green)' : 'var(--text-primary)', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
                          {isCopied ? <Check size={11} /> : <Copy size={11} />} {isCopied ? 'Copied' : 'Copy'}
                        </button>
                        <button onClick={() => openInTwitter(holder)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: twitterOpened ? 'rgba(255,224,72,0.06)' : 'var(--gray)', border: `1px solid ${twitterOpened ? 'rgba(255,224,72,0.3)' : 'var(--gray-light)'}`, borderRadius: 6, color: twitterOpened ? 'var(--gold)' : 'var(--text-primary)', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
                          <ExternalLink size={11} /> Open in Twitter
                        </button>
                        <button onClick={() => !isSent && markAsSent(holder)} disabled={isSent} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', background: isSent ? 'rgba(46,255,46,0.1)' : 'var(--gold)', border: isSent ? '1px solid rgba(46,255,46,0.2)' : 'none', borderRadius: 6, color: isSent ? 'var(--green)' : '#050505', fontSize: 11, fontWeight: 700, cursor: isSent ? 'default' : 'pointer' }}>
                          {isSent ? <><CheckCircle size={11} /> Sent</> : 'Mark as sent'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
              {allSent && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '16px', color: 'var(--green)', fontSize: 13, fontWeight: 600 }}>
                  All outreach logged. Cooldowns running.
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

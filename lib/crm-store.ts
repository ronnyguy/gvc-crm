// CRM Store - manages outreach logs, event history, cooldowns
// In production this would be a database. For now it's localStorage-backed.

export type TeamMember = 'Ronny' | 'Chris' | 'Ty' | 'Maison'

export const TEAM_MEMBERS: TeamMember[] = ['Ronny', 'Chris', 'Ty', 'Maison']

export const TEAM_COLORS: Record<TeamMember, string> = {
  Ronny: '#FFE048',
  Chris: '#FF6B9D',
  Ty: '#2EFF2E',
  Maison: '#60A5FA',
}

export type EventType =
  | 'outreach_dm'
  | 'bought_oe'
  | 'attended_space'
  | 'retweeted'
  | 'responded_dm'
  | 'discord_active'
  | 'quest_completed'
  | 'custom'

export const EVENT_LABELS: Record<EventType, string> = {
  outreach_dm: 'DM Sent',
  bought_oe: 'Bought OE',
  attended_space: 'Attended Space',
  retweeted: 'Retweeted GVC',
  responded_dm: 'Responded to DM',
  discord_active: 'Active in Discord',
  quest_completed: 'Completed Quest',
  custom: 'Note',
}

export const EVENT_ICONS: Record<EventType, string> = {
  outreach_dm: '💬',
  bought_oe: '🛒',
  attended_space: '🎙️',
  retweeted: '🔁',
  responded_dm: '✅',
  discord_active: '🎮',
  quest_completed: '⚡',
  custom: '📝',
}

export interface CRMEvent {
  id: string
  holderId: string
  type: EventType
  label: string
  note?: string
  by: TeamMember
  timestamp: string // ISO
}

export interface OutreachLog {
  id: string
  holderId: string
  by: TeamMember
  timestamp: string // ISO
  message: string
  gifUrl: string
  twitterOpened: boolean
}

export interface HolderCooldown {
  holderId: string
  days: number // cooldown duration in days
}

// Default cooldown
export const DEFAULT_COOLDOWN_DAYS = 14

// ─── Storage helpers ────────────────────────────────────────────────

function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function save<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

// ─── Events ────────────────────────────────────────────────────────

export function getEvents(): CRMEvent[] {
  return load<CRMEvent[]>('gvc_crm_events', [])
}

export function getEventsForHolder(holderId: string): CRMEvent[] {
  return getEvents().filter(e => e.holderId === holderId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export function addEvent(event: Omit<CRMEvent, 'id' | 'timestamp'>): CRMEvent {
  const events = getEvents()
  const newEvent: CRMEvent = {
    ...event,
    id: Math.random().toString(36).slice(2),
    timestamp: new Date().toISOString(),
  }
  save('gvc_crm_events', [newEvent, ...events])
  return newEvent
}

export function getAllEvents(): CRMEvent[] {
  return getEvents().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

// ─── Outreach logs ─────────────────────────────────────────────────

export function getOutreachLogs(): OutreachLog[] {
  return load<OutreachLog[]>('gvc_crm_outreach', [])
}

export function getOutreachForHolder(holderId: string): OutreachLog[] {
  return getOutreachLogs()
    .filter(l => l.holderId === holderId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export function logOutreach(log: Omit<OutreachLog, 'id' | 'timestamp'>): OutreachLog {
  const logs = getOutreachLogs()
  const newLog: OutreachLog = {
    ...log,
    id: Math.random().toString(36).slice(2),
    timestamp: new Date().toISOString(),
  }
  save('gvc_crm_outreach', [newLog, ...logs])

  // Also log as event
  addEvent({
    holderId: log.holderId,
    type: 'outreach_dm',
    label: `DM sent by ${log.by}`,
    note: log.message.slice(0, 80) + '...',
    by: log.by,
  })

  return newLog
}

export function getLastOutreach(holderId: string): OutreachLog | null {
  const logs = getOutreachForHolder(holderId)
  return logs[0] ?? null
}

// ─── Cooldowns ─────────────────────────────────────────────────────

export function getCooldowns(): HolderCooldown[] {
  return load<HolderCooldown[]>('gvc_crm_cooldowns', [])
}

export function getCooldownForHolder(holderId: string): number {
  const cooldowns = getCooldowns()
  return cooldowns.find(c => c.holderId === holderId)?.days ?? DEFAULT_COOLDOWN_DAYS
}

export function setCooldownForHolder(holderId: string, days: number): void {
  const cooldowns = getCooldowns().filter(c => c.holderId !== holderId)
  save('gvc_crm_cooldowns', [...cooldowns, { holderId, days }])
}

// ─── Lock status ────────────────────────────────────────────────────

export interface LockStatus {
  locked: boolean
  by?: TeamMember
  since?: string
  unlocksAt?: string
  daysLeft?: number
}

export function getLockStatus(holderId: string): LockStatus {
  const last = getLastOutreach(holderId)
  if (!last) return { locked: false }

  const cooldownDays = getCooldownForHolder(holderId)
  const since = new Date(last.timestamp)
  const unlocksAt = new Date(since.getTime() + cooldownDays * 24 * 60 * 60 * 1000)
  const now = new Date()

  if (now >= unlocksAt) return { locked: false }

  const daysLeft = Math.ceil((unlocksAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))

  return {
    locked: true,
    by: last.by,
    since: last.timestamp,
    unlocksAt: unlocksAt.toISOString(),
    daysLeft,
  }
}

// ─── Notes ─────────────────────────────────────────────────────────

export function getNotes(): Record<string, string> {
  return load<Record<string, string>>('gvc_crm_notes', {})
}

export function getNoteForHolder(holderId: string): string {
  return getNotes()[holderId] ?? ''
}

export function saveNoteForHolder(holderId: string, note: string): void {
  const notes = getNotes()
  save('gvc_crm_notes', { ...notes, [holderId]: note })
}

// ─── DM Angles ─────────────────────────────────────────────────────

export function getDMAngle(holderId: string, status: string, vibeScore: number, nftCount: number): string {
  if (vibeScore >= 80 && nftCount >= 3) {
    return "Treat them like inner circle. Reference their loyalty specifically - they've been here. Tease something exclusive or early."
  }
  if (vibeScore >= 70 && status === 'active') {
    return "They're engaged and vocal. Amplify them - let them know you see their energy and it matters to the community."
  }
  if (status === 'new') {
    return "Fresh face. Lead with warmth, not hype. Welcome them in, point them to Discord, make it feel personal not automated."
  }
  if (nftCount >= 3 && status === 'inactive') {
    return "Sleeping giant. They believed in GVC enough to hold multiple. Don't sell - reconnect. Make them feel missed, not marketed to."
  }
  if (status === 'inactive' && vibeScore < 30) {
    return "Been quiet a long time. Keep it short and genuine. One line, a GIF, no pressure. Plant the seed."
  }
  return "Check in casually. Lead with the community angle - what is happening, what they are missing. Keep it warm and low-pressure."
}

// ─── Seed demo data ─────────────────────────────────────────────────

export function seedDemoData(): void {
  if (typeof window === 'undefined') return
  if (localStorage.getItem('gvc_crm_seeded')) return

  const now = new Date()

  // Seed some past outreach
  const demoLogs: OutreachLog[] = [
    {
      id: 'demo1',
      holderId: '1',
      by: 'Chris',
      timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      message: 'Hey @vibechief! Just wanted to say we see you...',
      gifUrl: 'https://media2.giphy.com/media/2ATcJnbpzboIq4ZFNo/giphy.gif',
      twitterOpened: true,
    },
    {
      id: 'demo2',
      holderId: '6',
      by: 'Ronny',
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      message: 'Hey @toastlover_eth! Biggest holder in the community...',
      gifUrl: 'https://media3.giphy.com/media/M8OObCJn10limG2uNx/giphy.gif',
      twitterOpened: true,
    },
  ]

  const demoEvents: CRMEvent[] = [
    {
      id: 'ev1',
      holderId: '6',
      type: 'bought_oe',
      label: 'Bought Highkey OE',
      by: 'Ronny',
      timestamp: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'ev2',
      holderId: '1',
      type: 'attended_space',
      label: 'Attended Space Jan 12',
      by: 'Chris',
      timestamp: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'ev3',
      holderId: '4',
      type: 'retweeted',
      label: 'Retweeted GVC',
      by: 'Ty',
      timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'ev4',
      holderId: '9',
      type: 'quest_completed',
      label: 'Completed Quest #3',
      by: 'Ronny',
      timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'ev5',
      holderId: '6',
      type: 'outreach_dm',
      label: 'DM sent by Ronny',
      by: 'Ronny',
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'ev6',
      holderId: '1',
      type: 'outreach_dm',
      label: 'DM sent by Chris',
      by: 'Chris',
      timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]

  save('gvc_crm_outreach', demoLogs)
  save('gvc_crm_events', demoEvents)
  localStorage.setItem('gvc_crm_seeded', 'true')
}

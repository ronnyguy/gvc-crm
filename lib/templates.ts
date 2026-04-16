import { TeamMember } from './crm-store'

export interface DMTemplate {
  id: string
  label: string
  category: 'checkin' | 'recognition' | 'activation' | 'hype' | 'thankyou' | 'winback' | 'welcome' | 'referral'
  body: string
  hasPostUrl?: boolean
}

export const DEFAULT_TEMPLATES: DMTemplate[] = [
  // Check In
  { id: 'checkin_1', label: 'Miss your face', category: 'checkin', body: "Miss your face — hope you're doin awesome 🤙" },
  { id: 'checkin_2', label: 'Just checking in', category: 'checkin', body: "Yo! Just checkin in — hope you are thriving 🙏" },

  // Recognition
  { id: 'recognition_1', label: 'Total stud', category: 'recognition', body: "Thanks for being a total stud 🙏" },
  { id: 'recognition_2', label: 'Crushing content', category: 'recognition', body: "You are crushing the content 👏" },
  { id: 'recognition_3', label: "Don't deserve you", category: 'recognition', body: "The truth is.. we dont deserve you 😊" },
  { id: 'recognition_4', label: 'ILY reminder', category: 'recognition', body: "Just a reminder that ILY 😊" },

  // Activation
  { id: 'activation_space', label: 'Space invite', category: 'activation', body: "I triple dog dare you to pull up Thursday 🤗" },
  { id: 'activation_drop', label: 'New drop', category: 'activation', body: "👀 {postUrl}", hasPostUrl: true },

  // Hype
  { id: 'hype_1', label: 'Something coming', category: 'hype', body: "This might be something 👀" },

  // Thank You
  { id: 'thankyou_1', label: 'General gratitude', category: 'thankyou', body: "Just wanted to say thank you for rocking with us — it doesn't go unnoticed 🤙" },
  { id: 'thankyou_2', label: 'After a Space', category: 'thankyou', body: "Thanks for hanging in the space with us 🙏" },
  { id: 'thankyou_3', label: 'Grateful for you', category: 'thankyou', body: "Just wanted to say that we are grateful for you ❤️" },
  { id: 'thankyou_4', label: 'Content creation', category: 'thankyou', body: "Means a ton that you are creating so much content with us 😢" },

  // Win Back
  { id: 'winback_1', label: 'Win-back', category: 'winback', body: "Miss your face — hope you're absolutely crushin it 🙏" },

  // Welcome
  { id: 'welcome_1', label: 'New holder', category: 'welcome', body: "{name}!!! So freakin stoked to see you join Vibetown — my DMs are open 24/7. Jump in the Discord ASAP so we can party 🤙" },

  // Referral
  { id: 'referral_1', label: 'Recruit challenge', category: 'referral', body: "You dont have anyone that you'd like me to recruit to GVC, do you? 😏" },
]

export const CATEGORY_LABELS: Record<DMTemplate['category'], string> = {
  checkin: 'Check In',
  recognition: 'Recognition',
  activation: 'Activation',
  hype: 'Hype',
  thankyou: 'Thank You',
  winback: 'Win Back',
  welcome: 'Welcome',
  referral: 'Referral',
}

export const CATEGORY_ORDER: DMTemplate['category'][] = [
  'checkin', 'recognition', 'activation', 'hype', 'thankyou', 'winback', 'welcome', 'referral'
]

function storageKey(user: TeamMember) {
  return `gvc_crm_templates_${user.toLowerCase()}`
}

function enabledKey(user: TeamMember) {
  return `gvc_crm_enabled_templates_${user.toLowerCase()}`
}

export function getTemplatesForUser(user: TeamMember): DMTemplate[] {
  if (typeof window === 'undefined') return DEFAULT_TEMPLATES
  try {
    const raw = localStorage.getItem(storageKey(user))
    if (!raw) return DEFAULT_TEMPLATES
    const saved = JSON.parse(raw) as DMTemplate[]
    const savedIds = new Set(saved.map(t => t.id))
    const newDefaults = DEFAULT_TEMPLATES.filter(t => !savedIds.has(t.id))
    return [...saved, ...newDefaults]
  } catch {
    return DEFAULT_TEMPLATES
  }
}

export function saveTemplatesForUser(user: TeamMember, templates: DMTemplate[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(storageKey(user), JSON.stringify(templates))
  } catch {}
}

export function resetTemplatesForUser(user: TeamMember): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(storageKey(user))
  localStorage.removeItem(enabledKey(user))
}

// Cross-profile: get templates borrowed from other users
export function getEnabledBorrowedIds(user: TeamMember): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(enabledKey(user))
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

export function toggleBorrowedTemplate(user: TeamMember, templateId: string, enable: boolean): void {
  if (typeof window === 'undefined') return
  const current = getEnabledBorrowedIds(user)
  if (enable) current.add(templateId)
  else current.delete(templateId)
  localStorage.setItem(enabledKey(user), JSON.stringify([...current]))
}

// Get all templates visible to user — own + enabled borrowed
export function getAllVisibleTemplates(user: TeamMember, allUsers: TeamMember[]): DMTemplate[] {
  const own = getTemplatesForUser(user)
  const ownIds = new Set(own.map(t => t.id))
  const enabledBorrowed = getEnabledBorrowedIds(user)

  const borrowed: DMTemplate[] = []
  allUsers.filter(u => u !== user).forEach(other => {
    getTemplatesForUser(other).forEach(t => {
      if (!ownIds.has(t.id) && enabledBorrowed.has(`${other}::${t.id}`)) {
        borrowed.push({ ...t, id: `${other}::${t.id}`, label: `${t.label} (${other})` })
      }
    })
  })

  return [...own, ...borrowed]
}

export type HolderStatus = 'active' | 'inactive' | 'new'

export interface Holder {
  id: string
  wallet: string
  ens?: string
  twitter: string
  discord: string
  nftCount: number
  status: HolderStatus
  lastSeen: string
  joinedDate: string
  notes: string
  tags: string[]
  vibeScore: number
}

export const MOCK_HOLDERS: Holder[] = [
  { id: '1', wallet: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b', ens: 'vibechief.eth', twitter: '@vibechief', discord: 'vibechief#1234', nftCount: 4, status: 'active', lastSeen: '2024-01-15', joinedDate: '2022-08-01', notes: 'OG holder, very engaged in Discord. Always RTs.', tags: ['OG', 'Discord Active', 'Twitter Active'], vibeScore: 94 },
  { id: '2', wallet: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c', ens: 'solwave.eth', twitter: '@solwave_nft', discord: 'solwave#5678', nftCount: 2, status: 'active', lastSeen: '2024-01-14', joinedDate: '2022-10-15', notes: 'Active trader, picks up GVCs on dips.', tags: ['Trader', 'Twitter Active'], vibeScore: 81 },
  { id: '3', wallet: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d', twitter: '@artcollector99', discord: 'artcollector#9012', nftCount: 1, status: 'inactive', lastSeen: '2023-09-20', joinedDate: '2023-03-01', notes: 'Went quiet after summer. Worth re-engaging.', tags: ['Dormant'], vibeScore: 22 },
  { id: '4', wallet: '0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e', ens: 'gmfrens.eth', twitter: '@gmfrens', discord: 'gmfrens#3456', nftCount: 3, status: 'active', lastSeen: '2024-01-13', joinedDate: '2022-07-20', notes: 'Posts GMs every day. Great community vibe.', tags: ['OG', 'Community', 'Discord Active'], vibeScore: 89 },
  { id: '5', wallet: '0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f', twitter: '@nftmaxi2023', discord: 'nftmaxi#7890', nftCount: 1, status: 'inactive', lastSeen: '2023-07-04', joinedDate: '2023-04-10', notes: 'Bought during the rally, silent since.', tags: ['Dormant', 'Needs Outreach'], vibeScore: 15 },
  { id: '6', wallet: '0x6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a', ens: 'toastlover.eth', twitter: '@toastlover_eth', discord: 'toastlover#2345', nftCount: 5, status: 'active', lastSeen: '2024-01-15', joinedDate: '2022-06-01', notes: 'Biggest holder in the community. Super loyal.', tags: ['Whale', 'OG', 'Discord Active', 'Twitter Active'], vibeScore: 99 },
  { id: '7', wallet: '0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b', twitter: '@cryptomuse_', discord: 'cryptomuse#6789', nftCount: 2, status: 'new', lastSeen: '2024-01-12', joinedDate: '2024-01-10', notes: 'Just joined. Needs a welcome.', tags: ['New Holder'], vibeScore: 60 },
  { id: '8', wallet: '0x8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c', twitter: '@web3wanderer', discord: 'web3wanderer#1111', nftCount: 1, status: 'inactive', lastSeen: '2023-10-30', joinedDate: '2023-05-22', notes: 'Collector type, holds passively.', tags: ['Passive', 'Dormant'], vibeScore: 30 },
  { id: '9', wallet: '0x9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d', ens: 'pixelvibes.eth', twitter: '@pixelvibes_', discord: 'pixelvibes#4444', nftCount: 3, status: 'active', lastSeen: '2024-01-11', joinedDate: '2022-11-05', notes: 'Artist. Loves the IP direction.', tags: ['Artist', 'Community', 'Twitter Active'], vibeScore: 77 },
  { id: '10', wallet: '0xa0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9', twitter: '@holderguy_eth', discord: 'holderguy#9999', nftCount: 1, status: 'inactive', lastSeen: '2023-08-15', joinedDate: '2023-02-14', notes: 'Valentine drop buyer. Quiet since.', tags: ['Dormant', 'Needs Outreach'], vibeScore: 18 },
  { id: '11', wallet: '0xb1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0', ens: 'sunsetter.eth', twitter: '@sunsetter_eth', discord: 'sunsetter#2222', nftCount: 2, status: 'new', lastSeen: '2024-01-14', joinedDate: '2024-01-08', notes: 'New, came in via Twitter. Seems bullish.', tags: ['New Holder', 'Twitter Active'], vibeScore: 55 },
  { id: '12', wallet: '0xc2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1', twitter: '@deepvibes99', discord: 'deepvibes#3333', nftCount: 1, status: 'active', lastSeen: '2024-01-10', joinedDate: '2023-06-30', notes: 'Lurker but always present.', tags: ['Lurker'], vibeScore: 65 },
]

export const GVC_GIFS = [
  { id: 'welcome', label: 'Welcome', url: 'https://media3.giphy.com/media/M8OObCJn10limG2uNx/giphy.gif', emoji: '🤝' },
  { id: 'hype', label: 'Vibetown', url: 'https://media0.giphy.com/media/z4c3y3W8hhgH0wRaQc/giphy.gif', emoji: '🔥' },
  { id: 'sup', label: 'Sup', url: 'https://media2.giphy.com/media/2ATcJnbpzboIq4ZFNo/giphy.gif', emoji: '👋' },
  { id: 'thinking', label: 'Pondering', url: 'https://media3.giphy.com/media/WAJ9lDsrZcpZOfQ0nT/giphy.gif', emoji: '🤔' },
  { id: 'cool', label: 'Sunglasses', url: 'https://media2.giphy.com/media/mHvlVNAq27Y3aHx0t2/giphy.gif', emoji: '😎' },
  { id: 'love', label: 'Love', url: 'https://media2.giphy.com/media/wtCGxr8nkvlkQP7B2b/giphy.gif', emoji: '❤️' },
  { id: 'batman', label: 'Batman', url: 'https://media2.giphy.com/media/DrI0YHN02niFr1KV3B/giphy.gif', emoji: '🦇' },
  { id: 'xmas', label: 'Christmas', url: 'https://media2.giphy.com/media/ClU4DWejXfyfTzNfOt/giphy.gif', emoji: '🎄' },
  { id: 'santa', label: 'Santa', url: 'https://media0.giphy.com/media/N7bZmGrhsQ440hF5Yh/giphy.gif', emoji: '🎅' },
  { id: 'office', label: 'The Office', url: 'https://media1.giphy.com/media/xJf9WPNi0c5TYgHRWk/giphy.gif', emoji: '😏' },
]

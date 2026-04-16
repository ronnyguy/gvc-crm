'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Search, Loader2, CheckCircle, ExternalLink, Hash } from 'lucide-react'
import { getHolderBalance, getTokensForOwner, shortenWallet, getOpenSeaUrl, GVC_CONTRACT } from '@/lib/contract'
import { useToast } from './Toast'

interface Props {
  onClose: () => void
}

interface LookupResult {
  wallet: string
  balance: number
  tokens: number[]
}

export default function BlockchainLookup({ onClose }: Props) {
  const { toast } = useToast()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<LookupResult | null>(null)
  const [error, setError] = useState('')

  const lookup = async () => {
    const wallet = input.trim()
    if (!wallet) return
    if (!wallet.startsWith('0x') || wallet.length !== 42) {
      setError('Enter a valid Ethereum wallet address (0x...)')
      return
    }
    setError('')
    setLoading(true)
    setResult(null)

    try {
      const [balance, tokens] = await Promise.all([
        getHolderBalance(wallet),
        getTokensForOwner(wallet),
      ])
      setResult({ wallet, balance, tokens })
      toast('success', `Lookup complete`, `${balance} GVC${balance !== 1 ? 's' : ''} found`)
    } catch (e) {
      setError('Lookup failed. Check the wallet and try again.')
      toast('error', 'Lookup failed', 'Could not reach the blockchain')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        style={{
          background: 'var(--dark)',
          border: '1px solid var(--gray)',
          borderRadius: 20,
          width: '100%',
          maxWidth: 520,
          overflow: 'hidden',
          boxShadow: '0 0 60px rgba(255,224,72,0.08), 0 32px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--gray)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div className="font-brice" style={{ fontSize: 16, color: 'var(--gold)' }}>
              Blockchain Lookup
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>
              Check any wallet against the GVC contract
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'var(--gray)', border: 'none', borderRadius: 8,
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)', cursor: 'pointer',
          }}>
            <X size={15} />
          </button>
        </div>

        {/* Input */}
        <div style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && lookup()}
              placeholder="0x..."
              style={{
                flex: 1,
                background: 'var(--gray)',
                border: `1px solid ${error ? 'var(--red)' : 'var(--gray-light)'}`,
                borderRadius: 10,
                padding: '11px 14px',
                color: 'var(--text-primary)',
                fontSize: 13,
                fontFamily: 'monospace',
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => !error && (e.currentTarget.style.borderColor = 'var(--gold)')}
              onBlur={e => !error && (e.currentTarget.style.borderColor = 'var(--gray-light)')}
            />
            <button
              onClick={lookup}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '11px 18px',
                background: 'var(--gold)', color: 'var(--black)',
                border: 'none', borderRadius: 10,
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              {loading ? 'Looking...' : 'Lookup'}
            </button>
          </div>
          {error && (
            <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 8 }}>{error}</div>
          )}
        </div>

        {/* Result */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ padding: '0 24px 24px' }}
          >
            <div style={{
              background: 'var(--black)',
              border: '1px solid var(--gray)',
              borderRadius: 12,
              padding: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <CheckCircle size={16} style={{ color: 'var(--green)' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>Holder found</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Wallet</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                    {result.wallet}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>GVCs Held</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: result.balance > 0 ? 'var(--gold)' : 'var(--text-muted)' }}>
                      {result.balance}
                    </div>
                  </div>
                </div>

                {result.tokens.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Token IDs</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {result.tokens.map(id => (
                        <a
                          key={id}
                          href={getOpenSeaUrl(id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '4px 10px',
                            background: 'rgba(255,224,72,0.08)',
                            border: '1px solid rgba(255,224,72,0.2)',
                            borderRadius: 6,
                            color: 'var(--gold)',
                            fontSize: 12, fontWeight: 600,
                            textDecoration: 'none',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,224,72,0.15)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,224,72,0.08)')}
                        >
                          <Hash size={10} />#{id}
                          <ExternalLink size={10} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {result.balance === 0 && (
                  <div style={{
                    padding: '12px 16px',
                    background: 'rgba(255,68,68,0.06)',
                    border: '1px solid rgba(255,68,68,0.2)',
                    borderRadius: 8,
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                  }}>
                    This wallet holds no GVCs — not a current holder.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}

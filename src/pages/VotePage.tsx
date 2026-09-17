import { useState, useCallback, useEffect } from 'react'
import { Vote as VoteIcon, Wallet, CheckCircle2, AlertCircle, Loader2, User } from 'lucide-react'
import {
  type Candidate,
  fetchCandidates,
  fetchHasVoted,
  castVote,
  connectWallet,
} from '../lib/votingContract'

export default function VotePage() {
  const [account, setAccount] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [hasVoted, setHasVoted] = useState(false)
  const [votingFor, setVotingFor] = useState<bigint | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async (addr?: string) => {
    try {
      const cands = await fetchCandidates()
      setCandidates(cands)
      const checkAddr = addr ?? account
      if (checkAddr) {
        const voted = await fetchHasVoted(checkAddr)
        setHasVoted(voted)
      }
    } catch (err) {
      console.error('[VotePage] refresh failed:', err)
    }
  }, [account])

  useEffect(() => {
    refresh()
    const interval = setInterval(() => refresh(), 15000)
    return () => clearInterval(interval)
  }, [refresh])

  const handleConnect = async () => {
    setError(null)
    try {
      const addr = await connectWallet()
      if (!addr) {
        setError('MetaMask not found. Please install the MetaMask browser extension.')
        return
      }
      setAccount(addr)
      await refresh(addr)
    } catch (err) {
      console.error('[VotePage] wallet connect failed:', err)
      setError('Could not connect to your wallet. Please try again.')
    }
  }

  const handleVote = async (candidateId: bigint) => {
    if (!account) {
      setError('Please connect your wallet first.')
      return
    }
    if (hasVoted) {
      setError('You have already voted. Each wallet can only vote once.')
      return
    }
    setError(null)
    setSuccess(null)
    setVotingFor(candidateId)
    setLoading(true)

    try {
      await castVote(account, candidateId)
      setHasVoted(true)
      setSuccess('Vote cast successfully!')
      await refresh()
    } catch (err) {
      console.error('[VotePage] vote failed:', err)
      const msg = err instanceof Error ? err.message : 'Failed to cast vote.'
      if (msg.includes('revert') || msg.includes('Already voted')) {
        setError('The smart contract rejected your vote — this wallet has already voted.')
      } else if (msg.includes('User rejected')) {
        setError('You cancelled the transaction.')
      } else {
        setError(`Transaction failed: ${msg}`)
      }
    } finally {
      setLoading(false)
      setVotingFor(null)
    }
  }

  const totalVotes = candidates.reduce((sum, c) => sum + c.voteCount, 0n)

  return (
    <div className="page-container vote-page">
      <div className="form-page-header">
        <div className="form-page-icon vote-icon">
          <VoteIcon size={32} />
        </div>
        <h1>Civic Voting</h1>
        <p className="form-page-tagline">Cast your vote on the blockchain — transparent, verifiable, and tamper-proof.</p>
      </div>

      <div className="info-banner vote-banner">
        <Wallet size={18} />
        <span>Connect your MetaMask wallet to participate. Each wallet can vote only once — the smart contract enforces this automatically.</span>
      </div>

      {/* Wallet connection */}
      <div className="vote-wallet-section">
        {account ? (
          <div className="vote-wallet-connected">
            <CheckCircle2 size={18} />
            <span>Connected: {account.slice(0, 6)}...{account.slice(-4)}</span>
          </div>
        ) : (
          <button type="button" className="btn btn-primary vote-connect-btn" onClick={handleConnect}>
            <Wallet size={18} />
            Connect MetaMask
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <CheckCircle2 size={20} />
          <span>{success}</span>
        </div>
      )}

      {/* Vote status */}
      {account && hasVoted && (
        <div className="vote-already-voted">
          <CheckCircle2 size={18} />
          <span>You have already voted. Thank you for participating!</span>
        </div>
      )}

      {/* Candidate cards */}
      <div className="vote-candidates-grid">
        {candidates.length === 0 && (
          <p className="vote-loading">Loading candidates from the blockchain...</p>
        )}
        {candidates.map((c) => {
          const pct = totalVotes > 0n ? Number((c.voteCount * 100n) / totalVotes) : 0
          const isVoting = votingFor === c.id
          return (
            <div key={c.id} className="vote-candidate-card">
              <div className="vote-candidate-header">
                <div className="vote-candidate-icon">
                  <User size={28} />
                </div>
                <h3>{c.name}</h3>
              </div>
              <div className="vote-candidate-count">
                <span className="vote-count-number">{c.voteCount.toString()}</span>
                <span className="vote-count-label">votes</span>
              </div>
              <div className="vote-bar-container">
                <div className="vote-bar-fill" style={{ width: `${pct}%` }} />
              </div>
              <span className="vote-pct">{pct}%</span>
              <button
                type="button"
                className="btn btn-primary vote-btn"
                disabled={!account || hasVoted || loading}
                onClick={() => handleVote(c.id)}
              >
                {isVoting ? (
                  <>
                    <Loader2 size={18} className="spin" />
                    Voting...
                  </>
                ) : (
                  <>
                    <VoteIcon size={18} />
                    Vote
                  </>
                )}
              </button>
            </div>
          )
        })}
      </div>

      {candidates.length > 0 && (
        <div className="vote-total">
          <span>Total Votes Cast:</span>
          <strong>{totalVotes.toString()}</strong>
        </div>
      )}
    </div>
  )
}

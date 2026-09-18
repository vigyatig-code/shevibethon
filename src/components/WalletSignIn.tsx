import { Wallet } from 'lucide-react'
import { useWalletAuth } from '../hooks/useWalletAuth'

function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export default function WalletSignIn() {
  const { status, address, error, signIn, signOut } = useWalletAuth()

  const busy = status === 'connecting' || status === 'signing' || status === 'verifying'

  const busyLabel =
    status === 'connecting' ? 'Connecting…' :
    status === 'signing' ? 'Sign in wallet…' :
    status === 'verifying' ? 'Verifying…' : ''

  if (status === 'signed-in' && address) {
    return (
      <div className="civic-nav-wallet-signedin">
        <span className="civic-nav-wallet-address" title={address}>
          {shortenAddress(address)}
        </span>
        <button className="civic-nav-wallet-signout" onClick={signOut}>
          Sign Out
        </button>
      </div>
    )
  }

  return (
    <div className="civic-nav-wallet-wrap">
      <button
        className="civic-nav-wallet-btn"
        onClick={signIn}
        disabled={busy}
        aria-label="Sign in with wallet"
      >
        <Wallet size={16} />
        {busy ? busyLabel : 'Connect wallet'}
      </button>
      {error && <span className="civic-nav-wallet-error">{error}</span>}
    </div>
  )
}

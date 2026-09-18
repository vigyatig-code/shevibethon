import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { connectWallet, buildSignInMessage, signMessage } from '../lib/walletAuth'

type WalletAuthStatus = 'idle' | 'connecting' | 'signing' | 'verifying' | 'signed-in' | 'error'

export function useWalletAuth() {
  const [status, setStatus] = useState<WalletAuthStatus>('idle')
  const [address, setAddress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const signIn = useCallback(async () => {
    setStatus('connecting')
    setError(null)

    try {
      const walletAddress = await connectWallet()
      setStatus('signing')

      const nonceRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wallet-nonce`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ address: walletAddress }),
      })

      if (!nonceRes.ok) throw new Error('Failed to get nonce from server')
      const { nonce } = await nonceRes.json()

      const message = buildSignInMessage(walletAddress, nonce)
      const signature = await signMessage(walletAddress, message)

      setStatus('verifying')

      const verifyRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wallet-verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ address: walletAddress, message, signature }),
      })

      if (!verifyRes.ok) throw new Error('Wallet verification failed')
      const { tokenHash } = await verifyRes.json()

      const { error: otpError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'magiclink',
      })

      if (otpError) throw new Error(otpError.message)

      setAddress(walletAddress)
      setStatus('signed-in')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wallet sign-in failed')
      setStatus('error')
    }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setAddress(null)
    setStatus('idle')
  }, [])

  return { status, address, error, signIn, signOut }
}

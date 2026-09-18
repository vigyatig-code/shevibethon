import { getAddress } from 'viem'

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  on?: (event: string, handler: (...args: unknown[]) => void) => void
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void
}

declare global {
  interface Window {
    ethereum?: EthereumProvider
  }
}

export async function connectWallet(): Promise<string> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No Ethereum wallet found. Please install MetaMask or another wallet extension.')
  }

  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[]
  if (!accounts || accounts.length === 0) {
    throw new Error('No wallet account available.')
  }

  return getAddress(accounts[0])
}

export function buildSignInMessage(address: string, nonce: string): string {
  return [
    'Sign in to Civic Portal',
    '',
    `Wallet: ${address}`,
    '',
    `Nonce: ${nonce}`,
    '',
    'By signing this message, you verify ownership of this wallet address.',
  ].join('\n')
}

export async function signMessage(address: string, message: string): Promise<string> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No Ethereum wallet found.')
  }

  const signature = await window.ethereum.request({
    method: 'personal_sign',
    params: [message, address],
  }) as string

  if (!signature) {
    throw new Error('Signature was rejected or empty.')
  }

  return signature
}

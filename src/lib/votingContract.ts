import { createPublicClient, createWalletClient, custom, http } from 'viem'
import { polygonAmoy } from 'viem/chains'

export const CONTRACT_ADDRESS =
  '0x0000000000000000000000000000000000000000' as const

export const CHAIN = polygonAmoy

export const VOTING_ABI = [
  {
    type: 'function',
    name: 'getCandidates',
    inputs: [],
    outputs: [
      {
        type: 'tuple[]',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'name', type: 'string' },
          { name: 'voteCount', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'vote',
    inputs: [{ name: 'candidateId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'hasVoted',
    inputs: [{ name: 'voter', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'Voted',
    inputs: [
      { name: 'voter', type: 'address', indexed: true },
      { name: 'candidateId', type: 'uint256', indexed: true },
    ],
  },
] as const

export interface Candidate {
  id: bigint
  name: string
  voteCount: bigint
}

let publicClient: ReturnType<typeof createPublicClient> | null = null

export function getPublicClient() {
  if (!publicClient) {
    publicClient = createPublicClient({
      chain: CHAIN,
      transport: http(),
    })
  }
  return publicClient
}

export async function getWalletClient() {
  if (!window.ethereum) return null
  const client = createWalletClient({
    chain: CHAIN,
    transport: custom(window.ethereum),
  })
  return client
}

export async function connectWallet(): Promise<string | null> {
  if (!window.ethereum) return null
  const accounts = (await window.ethereum.request({
    method: 'eth_requestAccounts',
  })) as string[]
  return accounts?.[0] ?? null
}

export async function fetchCandidates(): Promise<Candidate[]> {
  const client = getPublicClient()
  const data = await client.readContract({
    address: CONTRACT_ADDRESS,
    abi: VOTING_ABI,
    functionName: 'getCandidates',
  })
  return data as unknown as Candidate[]
}

export async function fetchHasVoted(address: string): Promise<boolean> {
  const client = getPublicClient()
  const voted = await client.readContract({
    address: CONTRACT_ADDRESS,
    abi: VOTING_ABI,
    functionName: 'hasVoted',
    args: [address as `0x${string}`],
  })
  return voted as boolean
}

export async function castVote(
  account: string,
  candidateId: bigint,
): Promise<string> {
  const walletClient = await getWalletClient()
  if (!walletClient) throw new Error('No wallet found')

  const txHash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: VOTING_ABI,
    functionName: 'vote',
    args: [candidateId],
    account: account as `0x${string}`,
    chain: CHAIN,
  })

  const publicC = getPublicClient()
  await publicC.waitForTransactionReceipt({ hash: txHash })
  return txHash
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
      on?: (event: string, handler: (...args: unknown[]) => void) => void
      removeListener?: (event: string, handler: (...args: unknown[]) => void) => void
    }
  }
}

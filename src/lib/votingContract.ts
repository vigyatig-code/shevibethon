import { createPublicClient, createWalletClient, custom, http, parseAbi } from 'viem'
import { localhost } from 'viem/chains'

export const CONTRACT_ADDRESS =
  '0xe7f1725e7734ce288f8367e1bb143e90bb3f0512' as const

export const CHAIN = localhost

export const VOTING_ABI = parseAbi([
  'function getCandidates() view returns (tuple(uint256 id, string name, uint256 voteCount)[])',
  'function vote(uint256 candidateId)',
  'function hasVoted(address voter) view returns (bool)',
  'event Voted(address indexed voter, uint256 indexed candidateId)',
])

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

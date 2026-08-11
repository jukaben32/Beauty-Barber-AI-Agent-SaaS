import { createPublicClient, http, decodeEventLog, erc20Abi, isAddress, type Hash } from 'viem'
import { polygon, polygonAmoy } from 'viem/chains'

// USDC contract addresses per supported chain. Polygon mainnet is the only
// one configured today (see NEXT_PUBLIC_USDC_CONTRACT_POLYGON); Amoy testnet
// is listed so it's easy to wire up during development, but payments on it
// are rejected until an address is set.
const USDC_CONTRACTS: Record<number, string | undefined> = {
  [polygon.id]: process.env.NEXT_PUBLIC_USDC_CONTRACT_POLYGON,
  [polygonAmoy.id]: process.env.NEXT_PUBLIC_USDC_CONTRACT_POLYGON_AMOY,
}

const CHAINS = {
  [polygon.id]: polygon,
  [polygonAmoy.id]: polygonAmoy,
} as const

function getClient(chainId: number) {
  const chain = CHAINS[chainId as keyof typeof CHAINS]
  if (!chain) {
    throw new Error(`Unsupported chain id for payment verification: ${chainId}`)
  }
  // POLYGON_RPC_URL lets prod point at a real provider (Alchemy/Infura/
  // QuickNode/etc). Without it we fall back to viem's built-in public RPC,
  // which works but is rate-limited and not meant for production traffic.
  const rpcUrl = chainId === polygon.id ? process.env.POLYGON_RPC_URL : process.env.POLYGON_AMOY_RPC_URL
  return createPublicClient({ chain, transport: http(rpcUrl) })
}

export interface VerifyUsdcPaymentInput {
  txHash: string
  chainId: number
  expectedRecipient: string
  /** Human-readable amount, e.g. 25.5 for $25.50 USDC. */
  expectedMinAmount: number
}

export type VerifyUsdcPaymentResult = { ok: true } | { ok: false; reason: string }

/**
 * Confirms a USDC transfer actually happened on-chain: the transaction
 * succeeded, and one of its logs is an ERC-20 Transfer from the configured
 * USDC contract paying `expectedRecipient` at least `expectedMinAmount`.
 * This does NOT check who sent the funds — only that the clinic's wallet
 * was paid — so it can't be spoofed by reporting someone else's real
 * transaction, but it also doesn't need to know the payer's address up
 * front, which the client doesn't reliably have before signing.
 */
export async function verifyUsdcPayment(input: VerifyUsdcPaymentInput): Promise<VerifyUsdcPaymentResult> {
  if (!input.txHash || !/^0x[0-9a-fA-F]{64}$/.test(input.txHash)) {
    return { ok: false, reason: 'txHash is not a well-formed transaction hash' }
  }
  if (!isAddress(input.expectedRecipient)) {
    return { ok: false, reason: 'Business has no valid payment wallet configured' }
  }

  const tokenAddress = USDC_CONTRACTS[input.chainId]
  if (!tokenAddress || !isAddress(tokenAddress)) {
    return { ok: false, reason: `No USDC contract configured for chain ${input.chainId}` }
  }

  let client: ReturnType<typeof getClient>
  try {
    client = getClient(input.chainId)
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : 'Unsupported chain' }
  }

  let receipt
  try {
    receipt = await client.getTransactionReceipt({ hash: input.txHash as Hash })
  } catch {
    return { ok: false, reason: 'Transaction not found on-chain (it may still be pending — try again shortly)' }
  }

  if (receipt.status !== 'success') {
    return { ok: false, reason: 'Transaction failed on-chain' }
  }

  const expectedRecipient = input.expectedRecipient.toLowerCase()
  const expectedRaw = BigInt(Math.round(input.expectedMinAmount * 1_000_000)) // USDC has 6 decimals

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== tokenAddress.toLowerCase()) continue
    try {
      const decoded = decodeEventLog({ abi: erc20Abi, data: log.data, topics: log.topics, eventName: 'Transfer' })
      const to = (decoded.args as unknown as { to: string }).to
      const value = (decoded.args as unknown as { value: bigint }).value
      if (to.toLowerCase() === expectedRecipient && value >= expectedRaw) {
        return { ok: true }
      }
    } catch {
      // Not a Transfer log (or not decodable against erc20Abi) — skip it.
      continue
    }
  }

  return { ok: false, reason: 'No matching USDC transfer to the business wallet was found in this transaction' }
}

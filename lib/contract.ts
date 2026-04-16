import { createPublicClient, http, parseAbi } from 'viem'
import { mainnet } from 'viem/chains'

export const GVC_CONTRACT = '0xB8Ea78fcaCEf50d41375E44E6814ebbA36Bb33c4' as const
export const PUBLIC_RPC = 'https://ethereum-rpc.publicnode.com'

export const client = createPublicClient({
  chain: mainnet,
  transport: http(PUBLIC_RPC),
})

const ERC721_ABI = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenURI(uint256 tokenId) view returns (string)',
])

export async function getHolderBalance(wallet: string): Promise<number> {
  try {
    const balance = await client.readContract({
      address: GVC_CONTRACT,
      abi: ERC721_ABI,
      functionName: 'balanceOf',
      args: [wallet as `0x${string}`],
    })
    return Number(balance)
  } catch {
    return 0
  }
}

export async function getTotalSupply(): Promise<number> {
  try {
    const supply = await client.readContract({
      address: GVC_CONTRACT,
      abi: ERC721_ABI,
      functionName: 'totalSupply',
    })
    return Number(supply)
  } catch {
    return 0
  }
}

export async function getTokensForOwner(wallet: string): Promise<number[]> {
  try {
    const balance = await getHolderBalance(wallet)
    if (balance === 0) return []

    const tokenIds: number[] = []
    for (let i = 0; i < Math.min(balance, 10); i++) {
      try {
        const tokenId = await client.readContract({
          address: GVC_CONTRACT,
          abi: ERC721_ABI,
          functionName: 'tokenOfOwnerByIndex',
          args: [wallet as `0x${string}`, BigInt(i)],
        })
        tokenIds.push(Number(tokenId))
      } catch {
        break
      }
    }
    return tokenIds
  } catch {
    return []
  }
}

export function shortenWallet(wallet: string): string {
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
}

export function getOpenSeaUrl(tokenId: number): string {
  return `https://opensea.io/assets/ethereum/${GVC_CONTRACT}/${tokenId}`
}

export function getNFTImageUrl(tokenId: number): string {
  // Placeholder until OpenSea API key is added
  return `https://api.opensea.io/api/v2/chain/ethereum/contract/${GVC_CONTRACT}/nfts/${tokenId}`
}

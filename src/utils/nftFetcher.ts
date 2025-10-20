// frontend/src/utils/nftFetcher.ts
import type { Address } from 'viem';
import type { PublicClient } from 'viem';
import { abi as excelsiorNftAbi } from '../contracts/ExcelsiorMembershipNFT8.json';

export interface NFTAttribute {
  trait_type?: string;
  value: string | number | null;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: NFTAttribute[];
}

export interface NFT {
  tokenId: bigint;
  tokenIdString: string;
  metadata: NFTMetadata;
}

export interface FetchNFTOptions {
  limit?: number;
  start?: number;
  signal?: AbortSignal;
  useCache?: boolean;
}

export interface NFTCollectionResult {
  nfts: NFT[];
  hasMore: boolean;
}

const DEFAULT_LIMIT = 48;
const MAX_LIMIT = 200;
const TOKEN_BATCH_SIZE = 12;
const metadataCache = new Map<string, NFT>();

const getCacheKey = (contract: Address, tokenId: bigint) =>
  `${contract.toLowerCase()}:${tokenId.toString()}`;

const normaliseTokenUri = (tokenURI: string) =>
  tokenURI.startsWith('ipfs://')
    ? `https://ipfs.io/ipfs/${tokenURI.substring('ipfs://'.length)}`
    : tokenURI;

const chunkArray = <T,>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const fetchCollectionNFTs = async (
  publicClient: PublicClient,
  contractAddress: Address,
  options: FetchNFTOptions = {}
): Promise<NFTCollectionResult> => {
  const { limit = DEFAULT_LIMIT, start = 0, signal, useCache = true } = options;
  const safeLimit = Math.max(1, Math.min(limit, MAX_LIMIT));

  try {
    const totalSupply = (await publicClient.readContract({
      address: contractAddress,
      abi: excelsiorNftAbi,
      functionName: 'totalSupply',
    })) as bigint;

    const total = Number(totalSupply);
    if (!Number.isFinite(total) || total <= 0) {
      return { nfts: [], hasMore: false };
    }

    const startIndex = Math.max(0, start);
    const fetchCount = Math.min(safeLimit, Math.max(0, total - startIndex));
    const endIndexExclusive = startIndex + fetchCount;

    const indexRange = Array.from(
      { length: fetchCount },
      (_, index) => BigInt(startIndex + index)
    );

    const tokenIds: bigint[] = [];

    for (const chunk of chunkArray(indexRange, TOKEN_BATCH_SIZE)) {
      if (signal?.aborted) break;

      const results = await Promise.allSettled(
        chunk.map((tokenIndex) =>
          publicClient.readContract({
            address: contractAddress,
            abi: excelsiorNftAbi,
            functionName: 'tokenByIndex',
            args: [tokenIndex],
          }) as Promise<bigint>
        )
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          tokenIds.push(result.value);
        }
      }
    }

    const metadataResults: NFT[] = [];

    for (const chunk of chunkArray(tokenIds, TOKEN_BATCH_SIZE)) {
      if (signal?.aborted) break;

      const uriResponses = await Promise.allSettled(
        chunk.map((tokenId) =>
          publicClient.readContract({
            address: contractAddress,
            abi: excelsiorNftAbi,
            functionName: 'tokenURI',
            args: [tokenId],
          }) as Promise<string>
        )
      );

      const fetchPromises = uriResponses.map(async (result, index) => {
        if (result.status !== 'fulfilled') return null;

        const tokenId = chunk[index];
        const cacheKey = getCacheKey(contractAddress, tokenId);

        if (useCache && metadataCache.has(cacheKey)) {
          return metadataCache.get(cacheKey)!;
        }

        const tokenURI = result.value;
        const metadataUrl = normaliseTokenUri(tokenURI);

        const response = await fetch(metadataUrl, { signal });
        const metadata = (await response.json()) as NFTMetadata;

        const nft: NFT = {
          tokenId,
          tokenIdString: tokenId.toString(),
          metadata: {
            name: metadata?.name ?? `NFT #${tokenId}`,
            description: metadata?.description ?? '',
            image: metadata?.image ?? '',
            attributes: Array.isArray(metadata?.attributes)
              ? metadata.attributes
              : [],
          },
        };

        metadataCache.set(cacheKey, nft);
        return nft;
      });

      const resolved = await Promise.allSettled(fetchPromises);
      for (const item of resolved) {
        if (item.status === 'fulfilled' && item.value) {
          metadataResults.push(item.value);
        }
      }
    }

    const hasMore = endIndexExclusive < total;
    return { nfts: metadataResults, hasMore };
  } catch (error) {
    if (!(error instanceof Error && error.name === 'AbortError')) {
      console.error('Error fetching collection:', error);
    }
    return { nfts: [], hasMore: false };
  }
};

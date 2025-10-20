import { useEffect, useMemo, useState } from 'react';
import { usePublicClient } from 'wagmi';
import type { Address } from 'viem';
import type { NFT, NFTCollectionResult } from '../utils/nftFetcher';
import { fetchCollectionNFTs } from '../utils/nftFetcher';
import type { COLLECTIONS } from '../config/contracts';

type CollectionConfig = (typeof COLLECTIONS)[number];

interface CollectionPreviewState {
  status: 'idle' | 'loading' | 'success' | 'error';
  nfts: NFT[];
  error?: string;
}

const mapCollectionsToRecord = (
  collections: readonly CollectionConfig[],
  status: CollectionPreviewState['status']
) =>
  collections.reduce<Record<string, CollectionPreviewState>>((acc, collection) => {
    acc[collection.id] = { status, nfts: [] };
    return acc;
  }, {});

export const useCollectionPreviews = (
  collections: readonly CollectionConfig[],
  limit = 5
) => {
  const publicClient = usePublicClient();
  const [previews, setPreviews] = useState<Record<string, CollectionPreviewState>>(() =>
    mapCollectionsToRecord(collections, 'idle')
  );

  useEffect(() => {
    if (!publicClient || collections.length === 0) {
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    setPreviews(mapCollectionsToRecord(collections, 'loading'));

    const run = async () => {
      const tasks = collections.map(async (collection) => {
        try {
          const result: NFTCollectionResult = await fetchCollectionNFTs(
            publicClient,
            collection.address as Address,
            {
              limit,
              signal: controller.signal,
              useCache: true,
            }
          );
          return { id: collection.id, nfts: result.nfts };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Unable to load NFTs';
          return { id: collection.id, error: message };
        }
      });

      const results = await Promise.all(tasks);
      if (cancelled) return;

      setPreviews((prev) => {
        const next: Record<string, CollectionPreviewState> = { ...prev };
        results.forEach(({ id, nfts, error }) => {
          if (error) {
            next[id] = { status: 'error', nfts: [], error };
          } else {
            next[id] = { status: 'success', nfts: nfts ?? [] };
          }
        });
        return next;
      });
    };

    run();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [collections, limit, publicClient]);

  return useMemo(() => previews, [previews]);
};

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePublicClient } from 'wagmi';
import { NftCard } from './NftCard';
import { COLLECTIONS, EXCELSIOR_NFT_ADDRESS } from '../config/contracts';
import { fetchCollectionNFTs, type NFT as NFTSummary } from '../utils/nftFetcher';
import './NftList.css';

const MAX_TOKENS_TO_DISPLAY = 48;

export const NftList = () => {
  const { collectionId } = useParams<{ collectionId?: string }>();
  const [memberships, setMemberships] = useState<NFTSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreTokens, setHasMoreTokens] = useState(false);
  const publicClient = usePublicClient();

  const collection = useMemo(() => {
    if (!collectionId) return COLLECTIONS[0];
    return COLLECTIONS.find((item) => item.id === collectionId) ?? null;
  }, [collectionId]);

  const contractAddress = collection ? collection.address : EXCELSIOR_NFT_ADDRESS;

  useEffect(() => {
    if (!collection || !publicClient) return;

    let cancelled = false;
    const controller = new AbortController();

    const loadCollectionTokens = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { nfts, hasMore } = await fetchCollectionNFTs(
          publicClient,
          contractAddress as `0x${string}`,
          {
            limit: MAX_TOKENS_TO_DISPLAY,
            signal: controller.signal,
          }
        );

        if (!cancelled) {
          setMemberships(nfts);
          setHasMoreTokens(hasMore);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load collection tokens', err);
          setError(err instanceof Error ? err.message : 'Unable to load collection tokens');
          setMemberships([]);
          setHasMoreTokens(false);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadCollectionTokens();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [collection, contractAddress, publicClient]);

  if (!collection) {
    return (
      <div className="membership membership--empty">
        <h2>Collection not found</h2>
        <p>
          The requested Excelsior package is unavailable. Please choose a collection from the
          catalogue.
        </p>
      </div>
    );
  }

  return (
    <div className="membership">
      <header className="membership__header">
        <div>
          <span className="membership__eyebrow">Collection</span>
          <h1 className="membership__title">{collection.name}</h1>
          <p className="membership__subtitle">{collection.description}</p>
        </div>
        <div className="membership__meta">
          <span>Contract</span>
          <code>
            {contractAddress.slice(0, 6)}...{contractAddress.slice(contractAddress.length - 4)}
          </code>
        </div>
      </header>

      {isLoading ? (
        <div className="membership__empty">
          <h3>Loading NFTs...</h3>
          <p>Retrieving the latest Excelsior memberships for this collection.</p>
        </div>
      ) : error ? (
        <div className="membership__empty">
          <h3>Unable to load NFTs</h3>
          <p>{error}</p>
        </div>
      ) : memberships.length > 0 ? (
        <>
          {hasMoreTokens && (
            <p className="membership__hint">
              Showing the first {MAX_TOKENS_TO_DISPLAY} NFTs. Use the dashboard for the full
              membership list.
            </p>
          )}
          <div className="membership__grid">
            {memberships.map((membership) => (
              <NftCard
                key={membership.tokenIdString}
                tokenId={membership.tokenId}
                initialMetadata={membership.metadata}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="membership__empty">
          <h3>No memberships detected</h3>
          <p>
            We could not find any Excelsior NFTs for this wallet. Acquire a membership from the
            collections marketplace to unlock your benefits.
          </p>
        </div>
      )}
    </div>
  );
};

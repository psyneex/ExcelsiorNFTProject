import { useCallback, useEffect, useMemo, useState } from 'react';
import { useReadContract, useReadContracts } from 'wagmi';
import type { Abi } from 'viem';
import ExcelsiorNFT from '../contracts/ExcelsiorMembershipNFT8.json';
import { EXCELSIOR_NFT_ADDRESS } from '../config/contracts';
import { useOperatorStatus } from '../hooks/useOperatorStatus';
import { NftCard } from './NftCard';
import './AdminPage.css';

const excelsiorNftAbi = ExcelsiorNFT.abi as readonly unknown[] as Abi;

type CollectionViewMode = 'grid' | 'single';

interface CollectionStatsPayload {
  minted: number;
  filtered: number;
}

interface AllNftsListProps {
  searchTerm: string;
  viewMode: CollectionViewMode;
  onCollectionStatsChange?: (payload: CollectionStatsPayload) => void;
}

const AllNftsList = ({
  searchTerm,
  viewMode,
  onCollectionStatsChange,
}: AllNftsListProps) => {
  const { data: totalSupplyData, isLoading: isLoadingTotalSupply } = useReadContract({
    address: EXCELSIOR_NFT_ADDRESS,
    abi: excelsiorNftAbi,
    functionName: 'totalSupply',
  });

  const totalSupply = totalSupplyData
    ? BigInt(totalSupplyData as unknown as string)
    : 0n;

  // Prepare contracts array for useReadContracts
  const contractsArray = useMemo(
    () =>
      Array.from({ length: Number(totalSupply) }, (_, index) => ({
        address: EXCELSIOR_NFT_ADDRESS,
        abi: excelsiorNftAbi,
        functionName: 'tokenByIndex',
        args: [BigInt(index)] as const,
      })),
    [totalSupply]
  );

  const { data: tokenIdsData, isLoading: isLoadingTokenIds } = useReadContracts({
    contracts: contractsArray,
    query: {
      enabled: totalSupply > 0n,
    },
  });

  const tokenIds = useMemo(
    () =>
      (Array.isArray(tokenIdsData) ? tokenIdsData : [])
        .map((item) => item?.result as bigint | undefined)
        .filter((id): id is bigint => typeof id === 'bigint'),
    [tokenIdsData]
  );

  const filteredTokenIds = useMemo(() => {
    if (!searchTerm.trim()) return tokenIds;
    const normalised = searchTerm.trim().toLowerCase();
    return tokenIds.filter((tokenId) => tokenId.toString().toLowerCase().includes(normalised));
  }, [searchTerm, tokenIds]);

  const isLoadingData = isLoadingTotalSupply || isLoadingTokenIds;

  useEffect(() => {
    if (!onCollectionStatsChange || isLoadingData) {
      return;
    }

    onCollectionStatsChange({
      minted: tokenIds.length,
      filtered: filteredTokenIds.length,
    });
  }, [
    filteredTokenIds.length,
    isLoadingData,
    onCollectionStatsChange,
    tokenIds.length,
  ]);

  if (isLoadingData) {
    return <div className="admin__state">Loading all NFTs...</div>;
  }

  if (!tokenIds.length) {
    return <div className="admin__state">No NFTs found in the collection.</div>;
  }

  if (filteredTokenIds.length === 0) {
    return (
      <div className="admin__state">
        No NFTs match "{searchTerm}". Try another token number or clear the search filter.
      </div>
    );
  }

  const listClassName =
    viewMode === 'grid' ? 'admin__grid admin__grid--cards' : 'admin__grid admin__grid--single';

  return (
    <div className={listClassName}>
      {filteredTokenIds.map((tokenId) => (
        <NftCard key={tokenId.toString()} tokenId={tokenId} />
      ))}
    </div>
  );
};

export const AdminPage = () => {
  const { isConnected, isOperator, isLoading } = useOperatorStatus();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<CollectionViewMode>('grid');
  const [collectionStats, setCollectionStats] = useState({
    minted: 0,
    filtered: 0,
    lastUpdated: 0,
  });

  const handleCollectionStatsChange = useCallback(
    ({ minted, filtered }: CollectionStatsPayload) => {
      setCollectionStats((prev) => {
        if (
          prev.minted === minted &&
          prev.filtered === filtered
        ) {
          return prev;
        }

        return {
          minted,
          filtered,
          lastUpdated: Date.now(),
        };
      });
    },
    []
  );

  if (!isConnected) {
    return (
      <div className="admin__empty">
        <h2>Connect wallet</h2>
        <p>The Excelsior dashboard unlocks once you link an authorised wallet.</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="admin__state">Verifying operator access...</div>;
  }

  if (!isOperator) {
    return (
      <div className="admin__empty admin__empty--denied">
        <h2>Access denied</h2>
        <p>This wallet is not registered with dashboard privileges for Excelsior NFTs.</p>
      </div>
    );
  }

  return (
    <div className="admin page">
      <section className="page__section admin__hero">
        <header className="admin__hero-header">
          <span className="admin__eyebrow">Member Dashboard</span>
          <h1>Excelsior NFT dashboard</h1>
          <p>
            Review the full collection, refresh guest metadata, and manage reservation codes when
            you have operator rights.
          </p>
        </header>
      </section>

      <section className="page__section admin__inventory">
        <header className="admin__inventory-header">
          <div className="admin__inventory-copy">
            <h2>Minted memberships</h2>
            <p>Every Excelsior NFT currently in circulation appears below.</p>
          </div>
          <div className="admin__inventory-side">
            <div className="admin__stats">
              <div className="admin__stat">
                <span className="admin__stat-label">Minted</span>
                <strong className="admin__stat-value">{collectionStats.minted}</strong>
              </div>
              <div className="admin__stat">
                <span className="admin__stat-label">Visible</span>
                <strong className="admin__stat-value">{collectionStats.filtered}</strong>
              </div>
              <div className="admin__stat">
                <span className="admin__stat-label">Last Sync</span>
                <strong className="admin__stat-value">
                  {collectionStats.lastUpdated
                    ? new Intl.DateTimeFormat(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      }).format(collectionStats.lastUpdated)
                    : '--'}
                </strong>
              </div>
            </div>
          </div>
        </header>

        <div className="admin__toolbar">
          <label className="admin__search">
            <span className="admin__search-label">Filter by token</span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search token ID..."
              className="admin__search-input"
            />
          </label>

          <div className="admin__viewToggle">
            <span className="admin__view-label">View</span>
            <button
              type="button"
              className={`admin__view-btn ${viewMode === 'grid' ? 'admin__view-btn--active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              Cards
            </button>
            <button
              type="button"
              className={`admin__view-btn ${
                viewMode === 'single' ? 'admin__view-btn--active' : ''
              }`}
              onClick={() => setViewMode('single')}
            >
              Single
            </button>
          </div>
        </div>

        <div className="admin__collection">
          <AllNftsList
            searchTerm={searchTerm}
            viewMode={viewMode}
            onCollectionStatsChange={handleCollectionStatsChange}
          />
        </div>
      </section>
    </div>
  );
};

import './NFTOverview.css';

export type NFTListItem = {
  id: string;
  name: string;
  tokenId: string;
  imageUrl: string;
  ownerLabel?: string;
};

export type NFTOverviewProps = {
  items: NFTListItem[];
  isLoading?: boolean;
  isError?: boolean;
  onSelect: (id: string) => void;
};

const SKELETON_COUNT = 8;

export const NFTOverview = ({
  items,
  isLoading = false,
  isError = false,
  onSelect,
}: NFTOverviewProps) => {
  const renderSkeletons = () => (
    <ul className="nftoverview__list" aria-label="Loading NFTs">
      {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
        <li key={`nft-skeleton-${index}`} className="nftoverview__item">
          <div className="nftoverview__row nftoverview__row--loading" aria-hidden="true">
            <span className="nftoverview__thumb nftoverview__thumb--loading" />
            <div className="nftoverview__main">
              <span className="nftoverview__line nftoverview__line--primary" />
              <span className="nftoverview__line nftoverview__line--secondary" />
            </div>
            <span className="nftoverview__owner nftoverview__owner--loading" />
          </div>
        </li>
      ))}
    </ul>
  );

  const renderList = () => (
    <ul className="nftoverview__list">
      {items.map((item) => (
        <li key={item.id} className="nftoverview__item">
          <button
            type="button"
            className="nftoverview__row"
            onClick={() => onSelect(item.id)}
            aria-label={`View NFT ${item.name || item.tokenId}`}
          >
            <span className="nftoverview__thumb">
              <img src={item.imageUrl} alt={item.name || `Token ${item.tokenId}`} />
            </span>
            <div className="nftoverview__main">
              <span className="nftoverview__title">{item.name}</span>
              <span className="nftoverview__id">#{item.tokenId}</span>
            </div>
            <span className="nftoverview__owner">{item.ownerLabel}</span>
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <section className="nftoverview" aria-live="polite">
      {isError && (
        <div className="nftoverview__banner" role="status">
          Unable to load the latest NFT data. Showing cached results.
        </div>
      )}

      {isLoading ? (
        renderSkeletons()
      ) : items.length === 0 ? (
        <div className="nftoverview__empty">No NFTs found.</div>
      ) : (
        renderList()
      )}
    </section>
  );
};

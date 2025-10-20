import { useNavigate } from 'react-router-dom';
import { COLLECTIONS } from '../config/contracts';
import { useCollectionPreviews } from '../hooks/useCollections';
import './Collections.css';
import { NFTThumbnail } from './NFTThumbnail';

export const Collections = () => {
  const navigate = useNavigate();
  const previews = useCollectionPreviews(COLLECTIONS, 6);

  const handleCollectionClick = (collectionId: string) => {
    navigate(`/collection/${collectionId}`);
  };

  return (
    <div className="collections page">
      <section className="page__section collections__intro">
        <header className="page__section-header">
          <h1 className="page__title">Explore the Excelsior membership tiers</h1>
          <p className="page__subtitle">
            Each collection pairs a unique on-chain membership with curated resort privileges.
            Discover the benefits, check live availability, and dive into token metadata.
          </p>
        </header>

        <div className="collections__grid">
          {COLLECTIONS.map((collection) => {
            const state = previews[collection.id];
            const previewStatus = state?.status ?? 'idle';
            const nftList = state?.nfts ?? [];

            return (
              <article key={collection.id} className="collection-card">
                <div className="collection-card__media">
                  <img
                    src={collection.image}
                    alt={collection.name}
                    onError={(event) => {
                      const target = event.target as HTMLImageElement;
                      target.src =
                        'https://images.unsplash.com/photo-1542317868-5d6b0a1fbcce?auto=format&fit=crop&w=900&q=80';
                    }}
                  />
                </div>

                <div className="collection-card__body">
                  <div>
                    <span className="collection-card__eyebrow">Collection</span>
                    <h2 className="collection-card__title">{collection.name}</h2>
                    <p className="collection-card__description">{collection.description}</p>
                  </div>

                  <div className="collection-preview">
                    <header>
                      <h3>NFT preview</h3>
                      <span className="collection-preview__count">
                        {previewStatus === 'success' ? `${nftList.length} listed` : ''}
                      </span>
                    </header>

                    {previewStatus === 'loading' && (
                      <p className="collection-preview__state">Loading preview...</p>
                    )}

                    {previewStatus === 'error' && (
                      <p className="collection-preview__state collection-preview__state--error">
                        Unable to load preview
                      </p>
                    )}

                    {previewStatus === 'success' && nftList.length === 0 && (
                      <p className="collection-preview__state">No NFTs minted yet</p>
                    )}

                        {previewStatus === 'success' && nftList.length > 0 && (
                          <div className="collection-preview__grid">
                            {nftList.map((nft) => (
                              <figure
                                key={nft.tokenIdString}
                                className="collection-preview__figure"
                              >
                                <NFTThumbnail
                                  src={nft.metadata.image}
                                  alt={nft.metadata.name}
                                  className="collection-preview__thumb"
                                  onError={(event) => {
                                    const target = event.target as HTMLImageElement;
                                    target.src =
                                      'https://images.unsplash.com/photo-1529429617124-aee0a5f4c143?auto=format&fit=crop&w=600&q=80';
                                  }}
                                />
                              </figure>
                            ))}
                          </div>
                        )}
                  </div>

                  <div className="collection-card__footer">
                    <div className="collection-card__address">
                      <span>Contract</span>
                      <code>
                        {collection.address.slice(0, 6)}...
                        {collection.address.slice(collection.address.length - 4)}
                      </code>
                    </div>
                    <button
                      type="button"
                      className="collection-card__action"
                      onClick={() => handleCollectionClick(collection.id)}
                    >
                      View collection
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};

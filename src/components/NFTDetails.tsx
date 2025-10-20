import type { ChangeEvent } from 'react';
import './NFTDetails.css';

export type NFTDetailAttribute = {
  key: string;
  label: string;
  value: string;
  isEditable?: boolean;
  placeholder?: string;
};

export type NFTDetailsProps = {
  imageUrl: string;
  collectionName?: string;
  chainLabel?: string;
  name: string;
  tokenId: string;
  ownerLabel?: string;
  description?: string;
  attributes: NFTDetailAttribute[];
  statusMessage?: string;
  statusTone?: 'default' | 'error' | 'success';
  isEditing: boolean;
  isSaving?: boolean;
  isLoading?: boolean;
  isCodeRevealed?: boolean;
  secretCode?: string;
  canRevealCode?: boolean;
  revealDisabledReason?: string;
  onRevealCode: () => void;
  onSave: () => void;
  onCancel: () => void;
  onEditToggle: () => void;
  onChangeAttribute: (key: string, value: string) => void;
};

const SKELETON_ROWS = 4;

export const NFTDetails = ({
  imageUrl,
  collectionName,
  chainLabel,
  name,
  tokenId,
  ownerLabel,
  description,
  attributes,
  statusMessage,
  statusTone = 'default',
  isEditing,
  isSaving = false,
  isLoading = false,
  isCodeRevealed = false,
  secretCode,
  canRevealCode = false,
  revealDisabledReason,
  onRevealCode,
  onSave,
  onCancel,
  onEditToggle,
  onChangeAttribute,
}: NFTDetailsProps) => {
  const handleChange = (attributeKey: string) => (event: ChangeEvent<HTMLInputElement>) => {
    onChangeAttribute(attributeKey, event.target.value);
  };

  if (isLoading) {
    return (
      <section className="nftdetails nftdetails--loading" aria-busy="true">
        <div className="nftdetails__media nftdetails__media--loading" />
        <div className="nftdetails__skeleton-block">
          <span className="nftdetails__line nftdetails__line--lg" />
          <span className="nftdetails__line nftdetails__line--sm" />
        </div>
        <div className="nftdetails__skeleton-grid">
          {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
            <div key={`attr-skeleton-${index}`} className="nftdetails__skeleton-attr">
              <span className="nftdetails__line nftdetails__line--label" />
              <span className="nftdetails__line nftdetails__line--value" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="nftdetails">
      {statusMessage && (
        <div
          className={`nftdetails__status nftdetails__status--${statusTone}`}
          role={statusTone === 'error' ? 'alert' : 'status'}
        >
          {statusMessage}
        </div>
      )}

      <div className="nftdetails__layout">
        <div className="nftdetails__visual">
          <div className="nftdetails__media">
            <img src={imageUrl} alt={`${name} artwork`} />
          </div>
        </div>

        <div className="nftdetails__content">
          <header className="nftdetails__header">
            <div className="nftdetails__headerMeta">
              <span className="nftdetails__avatar">
                <img src={imageUrl} alt={`${collectionName || 'Collection'} avatar`} />
              </span>
              <div className="nftdetails__collection">
                <span className="nftdetails__collection-name">{collectionName}</span>
                {chainLabel && (
                  <span className="nftdetails__collection-chain" aria-label={`Chain ${chainLabel}`}>
                    {chainLabel}
                  </span>
                )}
              </div>
            </div>
            <div className="nftdetails__actions-top">
              {!isEditing && (
                <button type="button" className="nftdetails__button nftdetails__button--ghost" onClick={onEditToggle}>
                  Edit properties
                </button>
              )}
            </div>
          </header>

          <section className="nftdetails__info">
            <div className="nftdetails__title">
              <h1 className="nftdetails__name">
                {name}
                <span className="nftdetails__token">#{tokenId}</span>
              </h1>
              {ownerLabel && <span className="nftdetails__owner">Owned by {ownerLabel}</span>}
            </div>
            {description && <p className="nftdetails__description">{description}</p>}
          </section>

          <section className="nftdetails__secret">
            <header className="nftdetails__secret-header">
              <h2>Secret code</h2>
              {!isCodeRevealed && !canRevealCode && revealDisabledReason && (
                <span className="nftdetails__hint">{revealDisabledReason}</span>
              )}
            </header>

            {isCodeRevealed && secretCode ? (
              <p className="nftdetails__secret-code">{secretCode}</p>
            ) : (
              <button
                type="button"
                className="nftdetails__button nftdetails__button--ghost"
                disabled={!canRevealCode}
                onClick={onRevealCode}
              >
                Reveal Secret Code
              </button>
            )}
          </section>

          <footer className="nftdetails__footer">
            {isEditing ? (
              <div className="nftdetails__actions">
                <button
                  type="button"
                  className="nftdetails__button nftdetails__button--primary"
                  onClick={onSave}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving…' : 'Save changes'}
                </button>
                <button
                  type="button"
                  className="nftdetails__button nftdetails__button--tertiary"
                  onClick={onCancel}
                  disabled={isSaving}
                >
                  Cancel
                </button>
              </div>
            ) : null}
          </footer>
        </div>
      </div>

      <section className="nftdetails__attributes">
        <header className="nftdetails__attributes-header">
          <h2>Attributes</h2>
          {isEditing && <span className="nftdetails__hint">Editable fields are highlighted.</span>}
        </header>

        {attributes.length === 0 ? (
          <p className="nftdetails__empty">No attributes yet.</p>
        ) : (
          <div className="nftdetails__grid">
            {attributes.map((attr) => (
              <div
                key={attr.key}
                className={`nftdetails__attribute ${isEditing && attr.isEditable ? 'nftdetails__attribute--editable' : ''}`}
              >
                <label className="nftdetails__attribute-label" htmlFor={`attr-${attr.key}`}>
                  {attr.label}
                </label>
                {isEditing && attr.isEditable ? (
                  <input
                    id={`attr-${attr.key}`}
                    type="text"
                    value={attr.value}
                    placeholder={attr.placeholder}
                    onChange={handleChange(attr.key)}
                    className="nftdetails__input"
                    disabled={isSaving}
                  />
                ) : (
                  <span className="nftdetails__attribute-value">{attr.value}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  );
};

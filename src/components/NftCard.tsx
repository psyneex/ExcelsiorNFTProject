import { useState, useEffect, useMemo, useCallback } from 'react';
import { useReadContract, useWriteContract, usePublicClient, useAccount } from 'wagmi';
import { isAddressEqual, type Address } from 'viem';
import { abi as excelsiorNftAbi } from '../contracts/ExcelsiorMembershipNFT8.json';
import { EXCELSIOR_NFT_ADDRESS } from '../config/contracts';
import { useOperatorStatus } from '../hooks/useOperatorStatus';
import '../NFTCard.css';

interface NftAttribute {
  trait_type: string;
  value: string;
}

interface NftMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: NftAttribute[];
}

interface NftCardProps {
  tokenId: bigint;
  initialMetadata?: NftMetadata;
}

const READ_ONLY_TRAITS = new Set([
  'tokenid',
  'token id',
  'tier',
  'privatecode',
  'private code',
  'private reservation code',
]);
const APP_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbx9Om3XMKVR0YwMV4GAT3FFjLaKGLGF1zO7V5BB_5KoM52rwf7CkULKv86mqihJBr8/exec';

const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN;

export const NftCard = ({ tokenId, initialMetadata }: NftCardProps) => {
  const publicClient = usePublicClient();
  const { address: walletAddress, isConnected } = useAccount();
  const [metadata, setMetadata] = useState<NftMetadata | null>(
    initialMetadata ?? null
  );
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [privateCode, setPrivateCode] = useState<string>("");
  const [codeVisible, setCodeVisible] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [isSavingPending, setIsSavingPending] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { isOperator } = useOperatorStatus();
  const { writeContractAsync } = useWriteContract();

  // Fetch tokenURI and metadata
  const { data: tokenUri } = useReadContract({
    address: EXCELSIOR_NFT_ADDRESS,
    abi: excelsiorNftAbi,
    functionName: "tokenURI",
    args: [tokenId],
    query: {
      enabled: !initialMetadata,
    },
  });

  const { data: ownerData } = useReadContract({
    address: EXCELSIOR_NFT_ADDRESS,
    abi: excelsiorNftAbi,
    functionName: 'ownerOf',
    args: [tokenId],
  });

  const ownerAddress =
    typeof ownerData === 'string' ? (ownerData as Address) : undefined;
  const walletAddressChecksum = walletAddress as Address | undefined;
  const isHolder =
    Boolean(walletAddressChecksum) &&
    Boolean(ownerAddress) &&
    isAddressEqual(walletAddressChecksum as Address, ownerAddress as Address);
  const canReveal = isOperator || isHolder;
  const revealCtaText = !isConnected
    ? 'Connect wallet to reveal'
    : canReveal
    ? 'Show Private Code'
    : 'Only holder can reveal';

  const buildEditableMap = useCallback((data: NftMetadata) => {
    const editableMap: Record<string, string> = {};
    (data.attributes ?? []).forEach((attr: NftAttribute) => {
      const trait = attr.trait_type;
      if (trait && !READ_ONLY_TRAITS.has(trait.toLowerCase())) {
        editableMap[trait] = String(attr.value);
      }
    });
    return editableMap;
  }, []);

  useEffect(() => {
    if (initialMetadata) {
      setMetadata(initialMetadata);
      setEditedValues(buildEditableMap(initialMetadata));
      return;
    }
  }, [buildEditableMap, initialMetadata]);

  useEffect(() => {
    if (initialMetadata || !tokenUri) return;

    const fetchMetadata = async () => {
      try {
        const res = await fetch(tokenUri as string);
        const data = await res.json();
        setMetadata(data);

        setEditedValues(buildEditableMap(data));
      } catch (err) {
        console.error("Failed to fetch metadata", err);
      }
    };
    fetchMetadata();
  }, [buildEditableMap, initialMetadata, tokenUri]);

  useEffect(() => {
    setPrivateCode('');
    setCodeVisible(false);
    setStatus('');
    setIsEditing(false);
  }, [tokenId]);

  const handleInputChange = (key: string, value: string) => {
    setEditedValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveAllProperties = async () => {
    if (!metadata || !isOperator || !isEditing) return;

    setStatus('Saving properties...');
    setIsSavingPending(true);
  
    try {
      const updatedAttributes = (metadata.attributes ?? []).map((attr) => {
        const trait = attr.trait_type;
        if (!trait || READ_ONLY_TRAITS.has(trait.toLowerCase())) {
          return attr;
        }
        const nextValue = editedValues[trait] ?? String(attr.value);
        return {
          ...attr,
          value: nextValue,
        };
      });

      const updatedMetadata = {
        ...metadata,
        attributes: updatedAttributes,
      };
  
      // Post to worker
      const res = await fetch("https://excelsiornft.psyneex.workers.dev/pinata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedMetadata),
      });
  
      const data = await res.json();
  
      if (!data.cid) {
        console.error("Worker response:", data);
        throw new Error(data.error || "No CID returned from Worker");
      }
  
      // Update NFT on-chain
      if (!publicClient) {
        throw new Error("Wallet client not initialised");
      }

      const txHash = await writeContractAsync({
        address: EXCELSIOR_NFT_ADDRESS,
        abi: excelsiorNftAbi,
        functionName: "setTokenURI",
        args: [tokenId, `https://tomato-accurate-rabbit-784.mypinata.cloud/ipfs/${data.cid}`],
      });
  
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` });
  
      if (receipt.status === "success") {
        setMetadata((prev) =>
          prev
            ? {
                ...prev,
                attributes: updatedMetadata.attributes ?? prev.attributes,
              }
            : prev
        );
        setEditedValues(buildEditableMap(updatedMetadata));
        setIsEditing(false);
        setStatus("All properties saved successfully!");
        setTimeout(() => setStatus(""), 3000);
      } else throw new Error("Transaction failed");
    } catch (err) {
      console.error("Error saving properties:", err);
      setStatus(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsSavingPending(false);
    }
  };
  

  const handleShowCode = async () => {
    if (!metadata) return;
    if (!canReveal) {
      setStatus(
        isConnected
          ? 'Only the token holder or an operator can reveal this code.'
          : 'Connect your wallet to reveal this code.'
      );
      return;
    }
    const tokenIdFromMetadata = metadata.attributes.find((attr) => {
      const trait = attr.trait_type?.toLowerCase();
      return trait === 'tokenid' || trait === 'token id';
    })?.value;
    if (!tokenIdFromMetadata) return setStatus("TokenID not found in metadata");

    setStatus('Fetching code...');
    try {
      const res = await fetch(
        `${APP_SCRIPT_URL}?q=get_code&tokenId=${encodeURIComponent(
          String(tokenIdFromMetadata)
        )}&token=${ADMIN_TOKEN}`
      );
      const result = await res.json();
      if (result.status === "ok" && result.code) {
        setPrivateCode(result.code);
        setCodeVisible(true);
        setStatus("");
      } else {
        setStatus("Failed to fetch code");
      }
    } catch (err) {
      console.error(err);
      setStatus("Error fetching code");
    }
  };

  const handleCancelEditing = useCallback(() => {
    if (!metadata) return;
    setEditedValues(buildEditableMap(metadata));
    setIsEditing(false);
    setStatus('');
  }, [buildEditableMap, metadata]);

  const attributesToDisplay = useMemo(() => metadata?.attributes ?? [], [metadata]);

  if (!metadata) {
    return <div className="nftcard nftcard--loading">Loading NFT...</div>;
  }

  const isErrorState = status.toLowerCase().startsWith('error');
  const isSuccessState = status.toLowerCase().includes('success');
  const isRevealed = codeVisible && Boolean(privateCode);

  const collectionName = metadata.name?.split('#')[0]?.trim() || metadata.name || 'Excelsior NFT';
  const chainName = 'Ethereum';

  const cardClassName = ['nftcard', isEditing ? 'nftcard--editing' : '', isRevealed ? 'nftcard--revealed' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <article className={cardClassName}>
      {isErrorState && (
        <div className="nftcard__banner nftcard__banner--error">
          <span>{status}</span>
        </div>
      )}

      <div className="nftcard__layout">
        <div className="nftcard__visual">
          <div className="nftcard__media">
            <img src={metadata.image} alt={metadata.name} />
          </div>
        </div>

        <div className="nftcard__content">
          <header className="nftcard__header">
            <div className="nftcard__header-left">
              <span className="nftcard__avatar">
                <img src={metadata.image} alt={`${collectionName} avatar`} />
              </span>
              <div className="nftcard__collection">
                <span className="nftcard__collection-name">{collectionName}</span>
                <span className="nftcard__collection-chain" aria-label={`Chain ${chainName}`}>
                  {chainName}
                </span>
              </div>
            </div>
          </header>

          <section className="nftcard__title">
            <div className="nftcard__title-main">
              <h2>
                {metadata.name}{' '}
                <span className="nftcard__token">#{tokenId.toString()}</span>
              </h2>
              <span className="nftcard__badge">
                {isOperator ? 'Operator' : isHolder ? 'Member' : 'Guest'}
              </span>
            </div>
            <div className="nftcard__meta">
              <span className="nftcard__owner">Owned by {ownerAddress ?? '—'}</span>
            </div>
            <p className="nftcard__description">{metadata.description}</p>
          </section>

          <section className={`nftcard__secret ${isRevealed ? 'nftcard__secret--revealed' : ''}`}>
            {isRevealed ? (
              <p className="nftcard__secret-code">{privateCode}</p>
            ) : (
              <button
                onClick={handleShowCode}
                className="nftcard__button nftcard__button--ghost"
                disabled={!canReveal}
              >
                {revealCtaText}
              </button>
            )}

            {!isRevealed && !canReveal && (
              <p className="nftcard__hint">
                {!isConnected
                  ? 'Connect your wallet to manage or reveal membership codes.'
                  : 'Only the token holder or an operator can reveal this membership code.'}
              </p>
            )}
          </section>

          <footer className="nftcard__actions">
            {isOperator ? (
              isEditing ? (
                <div className="nftcard__actions-group">
                  <button
                    onClick={handleSaveAllProperties}
                    className="nftcard__button nftcard__button--primary"
                    disabled={isSavingPending}
                  >
                    {isSavingPending ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    className="nftcard__button nftcard__button--tertiary"
                    onClick={handleCancelEditing}
                    disabled={isSavingPending}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="nftcard__button nftcard__button--ghost"
                  onClick={() => setIsEditing(true)}
                >
                  Edit properties
                </button>
              )
            ) : (
              <button type="button" className="nftcard__button nftcard__button--ghost" disabled>
                Edit properties
              </button>
            )}
          </footer>

          {status && !isErrorState && !isSuccessState && (
            <p className="nftcard__status">{status}</p>
          )}
        </div>
      </div>

      <section className="nftcard__attributes">
        <header className="nftcard__attributes-header">
          <h3>Attributes</h3>
          {isSuccessState && !isErrorState && (
            <span className="nftcard__status nftcard__status--success">{status}</span>
          )}
        </header>

        {attributesToDisplay.length === 0 ? (
          <p className="nftcard__attributes-empty">No attributes yet.</p>
        ) : (
          <div className="nftcard__attributes-grid">
            {attributesToDisplay.map((attr, index) => {
              const trait = attr.trait_type;
              const key = trait ?? `attribute-${index}`;
              const baseValue = String(attr.value ?? '');
              const isEditable = Boolean(trait) && !READ_ONLY_TRAITS.has(trait.toLowerCase());
              const currentValue =
                isEditable && trait ? editedValues[trait] ?? baseValue : baseValue;

              return (
                <div key={`${key}-${tokenId.toString()}`} className="nftcard__attr">
                  <span className="nftcard__attr-key">{trait ?? 'Attribute'}</span>
                  {isEditable && trait && isOperator ? (
                    isEditing ? (
                      <input
                        type="text"
                        value={currentValue}
                        onChange={(event) => handleInputChange(trait, event.target.value)}
                        className="nftcard__input"
                        disabled={isSavingPending}
                      />
                    ) : (
                      <span className="nftcard__attr-value">{currentValue}</span>
                    )
                  ) : (
                    <span className="nftcard__attr-value">{currentValue}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </article>
  );
};

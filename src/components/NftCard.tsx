import React, { useState, useEffect } from "react";
import { useReadContract, useWriteContract, useAccount, usePublicClient } from "wagmi";
import { abi as excelsiorNftAbi } from "../contracts/ExcelsiorMembershipNFT8.json";
import { EXCELSIOR_NFT_ADDRESS } from "../config/contracts";
import '../NFTCard.css';

interface NftAttribute {
  trait_type: string;
  value: string;
}

interface NftMetadata {
  name: string;
  description: string;
  image: string;
  attributes: NftAttribute[];
}

interface NftCardProps {
  tokenId: bigint;
}

const OPERATOR_ROLE =
  "0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929"; // computed keccak256("OPERATOR_ROLE")
const APP_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbx9Om3XMKVR0YwMV4GAT3FFjLaKGLGF1zO7V5BB_5KoM52rwf7CkULKv86mqihJBr8/exec";
const APP_SCRIPT_URL_Metadata = 
  "https://script.google.com/macros/s/AKfycbyfVdnnUoWTG1zbLM7XCDgUY2njZ23Yj3XIWZdPMZuWcVvFO6R54nCos-Hr7SP8YAo/exec";
const ADMIN_TOKEN = "jVzQ6#6hYzQJ@Z&ChhHP";

export const NftCard = ({ tokenId }: NftCardProps) => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [metadata, setMetadata] = useState<NftMetadata | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [privateCode, setPrivateCode] = useState<string>("");
  const [codeVisible, setCodeVisible] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [isSavingPending, setIsSavingPending] = useState(false);

  // Check if connected wallet is operator
  const { data: roleData, isLoading: isLoadingRole } = useReadContract({
    address: EXCELSIOR_NFT_ADDRESS,
    abi: excelsiorNftAbi,
    functionName: "hasRole",
    args: [OPERATOR_ROLE, address ?? "0x0000000000000000000000000000000000000000"],
    query: { enabled: !!address && isConnected },
  });
  const isOperator = Boolean(roleData);
  const { writeContractAsync } = useWriteContract();

  // Fetch tokenURI and metadata
  const { data: tokenUri } = useReadContract({
    address: EXCELSIOR_NFT_ADDRESS,
    abi: excelsiorNftAbi,
    functionName: "tokenURI",
    args: [tokenId],
  });

  useEffect(() => {
    if (!tokenUri) return;

    const fetchMetadata = async () => {
      try {
        const res = await fetch(tokenUri as string);
        const data = await res.json();
        setMetadata(data);

        const props: Record<string, string> = {};
        data.attributes.forEach((attr: NftAttribute) => {
          if (!["Tier", "Credit", "ExpiresAt"].includes(attr.trait_type)) {
            props[attr.trait_type] = String(attr.value);
          }
        });
        setEditedValues(props);
      } catch (err) {
        console.error("Failed to fetch metadata", err);
      }
    };
    fetchMetadata();
  }, [tokenUri]);

  const handleInputChange = (key: string, value: string) => {
    setEditedValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveAllProperties = async () => {
    if (!metadata) return;
  
    setStatus("Saving properties...");
    setIsSavingPending(true);
  
    try {
      const updatedMetadata = {
        ...metadata,
        attributes: Object.entries(editedValues).map(([key, value]) => ({
          trait_type: key,
          value: value,
        })),
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
      const txHash = await writeContractAsync({
        address: EXCELSIOR_NFT_ADDRESS,
        abi: excelsiorNftAbi,
        functionName: "setTokenURI",
        args: [tokenId, `https://tomato-accurate-rabbit-784.mypinata.cloud/ipfs/${data.cid}`],
      });
  
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` });
  
      if (receipt.status === "success") {
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
    const tokenIdFromMetadata = metadata.attributes.find(
      (attr) => attr.trait_type === "TokenID"
    )?.value;
    if (!tokenIdFromMetadata) return setStatus("TokenID not found in metadata");

    setStatus("Fetching code...");
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

  if (!metadata) {
    return (
      <div
        style={{
          width: "300px",
          height: "400px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1e293b",
          color: "#f1f5f9",
          borderRadius: "16px",
          margin: "16px",
        }}
      >
        Loading NFT...
      </div>
    );
  }

  return (
      <div className="nftCard">
    {/* --- Column 1: Media --- */}
    <div className="nftCard__column nftCard__column--media">
      <img
        src={metadata.image}
        alt={metadata.name}
        className="nftCard__image"
      />
    </div>

    {/* --- Column 2: Properties --- */}
    <div className="nftCard__column nftCard__column--properties">
      <h3 className="properties__title">Properties</h3>
      <div className="properties__list">
        {Object.entries(editedValues).map(([key, value]: [string, string]) => (
          <div key={key} className="property">
            <span className="property__key">{key}:</span>
          {isOperator && key !== 'TokenID' ? (
            <input
              type="text"
              value={value}
              onChange={(e) => handleInputChange(key, e.target.value)}
              className="formInput"
            />
          ) : (
            <span className="property__value">{value}</span>
          )}
        </div>
      ))}
    </div>
  </div>

  {/* --- Column 3: Info & Actions --- */}
  <div className="nftCard__column nftCard__column--info">
    <div className="info__details">
      <h2 className="nftCard__title">
        {metadata.name} #{tokenId.toString()}
      </h2>
      <p className="nftCard__description">{metadata.description}</p>
    </div>

    <div className="actions">
      {isOperator && (
        <button
          onClick={handleSaveAllProperties}
          className="btn btn--primary"
          disabled={isSavingPending}
        >
          {isSavingPending ? "Saving..." : "Save All Properties"}
        </button>
      )}

      {!codeVisible && (
        <button onClick={handleShowCode} className="btn btn--primary">
          Show Private Code
        </button>
      )}

      {status && <p style={{ color: "red", marginTop: "4px" }}>{status}</p>}

      {codeVisible && privateCode && (
        <div className="privateCode">{privateCode}</div>
      )}
    </div>
  </div>
</div>
);
};

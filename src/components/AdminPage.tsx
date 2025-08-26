import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import { keccak256, toUtf8Bytes, getAddress } from 'ethers';
import type { Abi } from 'viem';
import ExcelsiorNFT from '../contracts/ExcelsiorMembershipNFT8.json';
import { EXCELSIOR_NFT_ADDRESS } from '../config/contracts';

// Cast the ABI to the expected type
const excelsiorNftAbi = ExcelsiorNFT.abi as readonly unknown[] as Abi;
import { NftCard } from './NftCard';


// Compute OPERATOR_ROLE exactly like Solidity
const OPERATOR_ROLE = keccak256(toUtf8Bytes("OPERATOR_ROLE"));

const AllNftsList = () => {
  const { data: totalSupplyData, isLoading: isLoadingTotalSupply } = useReadContract({
    address: EXCELSIOR_NFT_ADDRESS,
    abi: excelsiorNftAbi,
    functionName: 'totalSupply',
  });

  const totalSupply = totalSupplyData
    ? BigInt(totalSupplyData as unknown as string)
    : 0n;

  // Prepare contracts array for useReadContracts
  const contractsArray = Array.from({ length: Number(totalSupply) }, (_, i) => ({
    address: EXCELSIOR_NFT_ADDRESS,
    abi: excelsiorNftAbi,
    functionName: 'tokenByIndex',
    args: [i.toString()] as const, 
  }));  

  const { data: tokenIdsData, isLoading: isLoadingTokenIds } = useReadContracts({
    contracts: contractsArray,
    query: {
      enabled: totalSupply > 0n,
    },
  });

  if (isLoadingTotalSupply || isLoadingTokenIds) {
    return <div style={{ textAlign: "center", marginTop: "20px" }}>Loading all NFTs...</div>;
  }

  if (!tokenIdsData || tokenIdsData.length === 0) {
    return <div style={{ textAlign: "center", marginTop: "20px" }}>No NFTs found in the collection.</div>;
  }

  const tokenIds = tokenIdsData
    .map((d) => d?.result as string | undefined)
    .filter((id): id is string => id !== undefined)
    .map((id) => BigInt(id)); // convert back to BigInt for NftCard

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "center" }}>
      {tokenIds.map((tokenId) => (
        <NftCard key={tokenId.toString()} tokenId={tokenId} />
      ))}
    </div>
  );
};

export const AdminPage = () => {
  const { address, isConnected } = useAccount();

  const checksummedAddress = address ? getAddress(address) : '0x0000000000000000000000000000000000000000';

  // DEBUG: Check hasRole return
  const { data: roleData, isLoading: isLoadingRole } = useReadContract({
    address: EXCELSIOR_NFT_ADDRESS,
    abi: excelsiorNftAbi,
    functionName: 'hasRole',
    args: [OPERATOR_ROLE, checksummedAddress],
    query: {
      enabled: !!address && isConnected,
    },
  });

  console.log("Wallet:", checksummedAddress);
  console.log("OPERATOR_ROLE:", OPERATOR_ROLE);
  console.log("hasRole raw data:", roleData);

  const isOperator = Boolean(roleData);

  if (!isConnected) {
    return <div style={{ textAlign: "center", marginTop: "20px" }}>Please connect your wallet.</div>;
  }

  if (isLoadingRole) {
    return <div style={{ textAlign: "center", marginTop: "20px" }}>Verifying access...</div>;
  }

  if (!isOperator) {
    return (
      <div style={{ textAlign: "center", marginTop: "20px", color: "red" }}>
        Access Denied: You are not an operator.
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ textAlign: "center" }}>NFT Admin Panel</h1>
      <p style={{ textAlign: "center" }}>
        Welcome, operator! Here you can manage all NFTs in the collection.
      </p>
      <AllNftsList />
    </div>
  );
};

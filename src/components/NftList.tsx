import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import { useState, useEffect } from 'react';
import { abi as excelsiorNftAbi } from '../contracts/ExcelsiorMembershipNFT8.json';
import { NftCard } from './NftCard';
import { EXCELSIOR_NFT_ADDRESS } from '../config/contracts';

const nftContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
};

export const NftList = () => {
  const { address, isConnected } = useAccount();
  const [tokenIds, setTokenIds] = useState<bigint[]>([]);

  const { data: balance, isSuccess: isBalanceSuccess } = useReadContract({
    address: EXCELSIOR_NFT_ADDRESS,
    abi: excelsiorNftAbi,
    functionName: 'balanceOf',
    args: [address!],
    query: {
      enabled: isConnected,
    },
  });

  const balanceAsNumber = isBalanceSuccess ? Number(balance) : 0;

  const tokenOfOwnerByIndexContracts = Array.from({ length: balanceAsNumber }, (_, index) => ({
    address: EXCELSIOR_NFT_ADDRESS,
    abi: excelsiorNftAbi,
    functionName: 'tokenOfOwnerByIndex',
    args: [address!, index],
  }));

  const { data: ownerTokenIds, isSuccess: isTokenIdsSuccess } = useReadContracts({
    contracts: tokenOfOwnerByIndexContracts as any,
    query: {
      enabled: isConnected && isBalanceSuccess && balanceAsNumber > 0,
    },
  });

  useEffect(() => {
    if (isTokenIdsSuccess && ownerTokenIds) {
      const validTokenIds = ownerTokenIds
        .filter((item) => item.status === 'success')
        .map((item) => item.result as bigint);
      setTokenIds(validTokenIds);
    } else if (balanceAsNumber === 0) {
      setTokenIds([]);
    }
  }, [isTokenIdsSuccess, ownerTokenIds, balanceAsNumber]);

  if (!isConnected) {
    return <div style={{ textAlign: 'center', marginTop: '20px' }}>Please connect your wallet to see your NFTs.</div>;
  }

  return (
    <div>
      <h2 style={{ textAlign: 'center' }}>Your NFT Memberships</h2>
      {tokenIds.length > 0 ? (
        <div style={nftContainerStyle}>
          {tokenIds.map((tokenId) => (
            <NftCard key={tokenId} tokenId={tokenId} />
          ))}
        </div>
      ) : (
        <p style={{ textAlign: 'center' }}>No Excelsior Hotel NFTs found in your wallet.</p>
      )}
    </div>
  );
};

import { useAccount, useReadContract } from 'wagmi';
import { keccak256, toBytes, getAddress, zeroAddress } from 'viem';
import type { Abi } from 'viem';
import ExcelsiorNFT from '../contracts/ExcelsiorMembershipNFT8.json';
import { EXCELSIOR_NFT_ADDRESS } from '../config/contracts';

const excelsiorNftAbi = ExcelsiorNFT.abi as Abi;
const OPERATOR_ROLE = keccak256(toBytes('OPERATOR_ROLE'));

export const useOperatorStatus = () => {
  const { address, isConnected } = useAccount();
  const checksummedAddress = address ? getAddress(address) : undefined;

  const {
    data: roleData,
    isLoading,
    refetch,
  } = useReadContract({
    address: EXCELSIOR_NFT_ADDRESS,
    abi: excelsiorNftAbi,
    functionName: 'hasRole',
    args: [OPERATOR_ROLE, checksummedAddress ?? zeroAddress],
    query: {
      enabled: isConnected && Boolean(address),
    },
  });

  return {
    isOperator: Boolean(roleData),
    isLoading,
    role: OPERATOR_ROLE,
    address: checksummedAddress,
    isConnected,
    refresh: refetch,
  };
};

export { OPERATOR_ROLE };

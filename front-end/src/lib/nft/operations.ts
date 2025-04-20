import { PostConditionMode, stringAsciiCV } from '@stacks/transactions';
import { getNftContract } from '@/constants/contracts';
import { Network } from '@/lib/network';
import { ContractCallRegularOptions } from '@/lib/contract-utils';

export const mintAvatar = (
  network: Network,
  metadataCid: string
): ContractCallRegularOptions => {
  const contract = getNftContract(network);

  return {
    ...contract,
    network,
    anchorMode: 1, // AnchorMode.Any or AnchorMode.OnChain
    functionName: 'mint-public', // Matches the contract function
    functionArgs: [stringAsciiCV(metadataCid)], // Pass the metadata CID
    postConditionMode: PostConditionMode.Deny,
    postConditions: [], // Add post-conditions if needed
  };
};

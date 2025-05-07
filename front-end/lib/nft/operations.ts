import { PostConditionMode, stringAsciiCV, AnchorMode } from '@stacks/transactions';
import { getNftContract } from '@/constants/contracts';
import { Network } from '@/lib/network';
import { ContractCallRegularOptions } from '@/lib/contract-utils';

export const mintModel = (
  network: Network,
  metadataCid: string
): ContractCallRegularOptions => {
  const contract = getNftContract();

  console.log('Mint Avatar Contract Details:', contract);

  const txOptions = {
    contractAddress: contract.contractAddress,
    contractName: contract.contractName,
    network,
    anchorMode: AnchorMode.Any,
    functionName: 'mint-public', 
    functionArgs: [stringAsciiCV(metadataCid)],
    postConditionMode: PostConditionMode.Deny,
    postConditions: [], 
  };

  console.log('Generated Transaction Options:', txOptions);

  return txOptions;
};

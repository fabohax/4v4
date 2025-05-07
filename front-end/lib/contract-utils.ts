import { STACKS_TESTNET } from '@stacks/network'; // Import STACKS_TESTNET for testnet configuration
import { ContractCallRegularOptions as ContractCallRegularOptionsType } from '@stacks/connect';
import {
  makeContractCall,
  broadcastTransaction,
  SignedContractCallOptions,
  ClarityValue,
  PostCondition,
  PostConditionMode,
  AnchorMode,
  stringAsciiCV, // Import the correct ClarityValue constructor
} from '@stacks/transactions';
import { generateWallet } from '@stacks/wallet-sdk';
import { isDevnetEnvironment } from './use-network';
import { Network } from '@/lib/network';
export type ContractCallRegularOptions = ContractCallRegularOptionsType;

// Replace DEVNET_NETWORK with testnet configuration
const TESTNET_NETWORK = STACKS_TESTNET;

interface DirectCallResponse {
  txid: string;
}

export const shouldUseDirectCall = isDevnetEnvironment;

export const executeContractCall = async (
  txOptions: ContractCallRegularOptions,
  currentWallet: { mnemonic: string } | null
): Promise<DirectCallResponse> => {
  const mnemonic = currentWallet?.mnemonic;
  if (!mnemonic) throw new Error('Testnet wallet not configured');

  const wallet = await generateWallet({
    secretKey: mnemonic,
    password: 'password',
  });

  const contractCallTxOptions: SignedContractCallOptions = {
    ...txOptions,
    network: TESTNET_NETWORK, // Use testnet network
    senderKey: wallet.accounts[0].stxPrivateKey,
    functionArgs: txOptions.functionArgs as ClarityValue[],
    postConditions: txOptions.postConditions as PostCondition[],
    postConditionMode: PostConditionMode.Allow,
    fee: 1000,
  };

  const transaction = await makeContractCall(contractCallTxOptions);

  const response = await broadcastTransaction({
    transaction,
    network: contractCallTxOptions.network,
  });

  if ('error' in response) {
    throw new Error(response.error || 'Transaction failed');
  }

  return { txid: response.txid };
};

export const openContractCall = async (options: ContractCallRegularOptions) => {
  try {
    const { openContractCall: stacksOpenContractCall } = await import('@stacks/connect');
    return stacksOpenContractCall(options);
  } catch (error) {
    console.error('Failed to load @stacks/connect:', error);
    throw error;
  }
};

export const mintModel = (network: Network, metadataCid: string) => {
  return {
    contractAddress: 'ST3ZFT624V70VXEYAZ51VPKRHXSEQRT6PA51T2SPS', // Replace with your testnet contract address
    contractName: 'avatar-minter', // Replace with your testnet contract name
    functionName: 'mint-public',
    functionArgs: [
      stringAsciiCV(metadataCid), // Use the correct ClarityValue constructor
    ],
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    postConditions: [],
  };
};

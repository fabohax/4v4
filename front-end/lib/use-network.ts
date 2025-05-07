'use client';
import { Network, NetworkDetails } from '@/lib/network';

export const getNetwork = (): NetworkDetails => {
  const network = process.env.NEXT_PUBLIC_STACKS_NETWORK || 'testnet';

  switch (network) {
    case 'testnet':
      return {
        chain: 'testnet',
        explorerUrl: 'https://explorer.hiro.so',
        coreApiUrl: 'https://api.testnet.hiro.so',
      };
    default:
      throw new Error(`Unsupported STACKS_NETWORK: ${network}`);
  }
};

export const useNetwork = () => {
  return {
    chain: 'testnet',
    explorerUrl: 'https://explorer.hiro.so',
    coreApiUrl: 'https://api.testnet.hiro.so',
  };
};

export const isDevnetEnvironment = () => {
  return false;
};

export const isTestnetEnvironment = (network: Network | null) => {
  return network === 'testnet';
};

export const isMainnetEnvironment = (network: Network | null) => {
  return false;
};

// Export NetworkDetails
export type { NetworkDetails, Network };


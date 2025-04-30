'use client';
import { Network, NetworkDetails } from '@/lib/network';

export const getNetwork = (): NetworkDetails => {
  const network = process.env.NEXT_PUBLIC_STACKS_NETWORK || 'testnet';

  switch (network) {
    case 'mainnet':
      return {
        chain: 'mainnet',
        explorerUrl: 'https://explorer.hiro.so',
        coreApiUrl: 'https://api.mainnet.hiro.so',
      };
    case 'testnet':
      return {
        chain: 'testnet',
        explorerUrl: 'https://explorer.hiro.so',
        coreApiUrl: 'https://api.testnet.hiro.so',
      };
    case 'devnet':
      return {
        chain: 'devnet',
        explorerUrl: 'http://localhost:3999',
        coreApiUrl: 'http://localhost:3999',
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
  return process.env.NEXT_PUBLIC_STACKS_NETWORK === 'devnet' && process.env.NEXT_PUBLIC_PLATFORM_HIRO_API_KEY;
};

export const isTestnetEnvironment = (network: Network | null) => {
  return network === 'testnet';
};

export const isMainnetEnvironment = (network: Network | null) => {
  return network === 'mainnet';
};

// Export NetworkDetails
export type { NetworkDetails, Network };


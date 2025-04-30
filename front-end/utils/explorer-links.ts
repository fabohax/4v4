import { PLATFORM_API_DOMAIN } from '@/constants/devnet';
import { Network } from '@/lib/network';
import { isDevnetEnvironment } from '@/lib/use-network';

export type CustomNetwork = 
  | { type: 'mainnet'; explorerUrl: string }
  | { type: 'testnet'; explorerUrl: string }
  | { type: 'devnet'; explorerUrl: string };

export const getExplorerLink = (txId: string, network?: CustomNetwork): string => {
  const baseUrl = network?.explorerUrl || 'https://testnet-explorer.hiro.so';
  const cleanTxId = txId.replace('0x', '');
  return `${baseUrl}/txid/${cleanTxId}`;
};

export const getTokenExplorerLink = (tokenId: string, network: { explorerUrl: string }) => {
  if (!network || !network.explorerUrl) {
    throw new Error('Network or explorer URL is not defined.');
  }

  return `${network.explorerUrl}/token/${tokenId}`;
};

export interface NetworkDetails {
  explorerUrl: string;
  chain: Network;
  coreApiUrl: string;
}

export type Network = 'mainnet' | 'testnet' | 'devnet';

export function getPersistedNetwork(): Network {
  if (typeof window !== 'undefined') {
    try {
      const storedNetwork = localStorage.getItem('network');
      if (
        storedNetwork === 'mainnet' ||
        storedNetwork === 'testnet' ||
        storedNetwork === 'devnet'
      ) {
        return storedNetwork as unknown as Network;
      }
    } catch (error) {
      console.error('Failed to access network from localStorage:', error);
    }
  }
  return 'testnet';
}

export function persistNetwork(newNetwork: Network): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('network', JSON.stringify(newNetwork));
    } catch (error) {
      console.error('Failed to set network in localStorage:', error);
    }
  }
}

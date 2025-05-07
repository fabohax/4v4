export interface NetworkDetails {
    explorerUrl: string;
    chain: Network;
    coreApiUrl: string;
  }
  
  export type Network = 'testnet';
  
  export function getPersistedNetwork(): Network {
    return 'testnet'; // Hardcoded to testnet
  }
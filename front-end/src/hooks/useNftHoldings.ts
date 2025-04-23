import { UseQueryResult, useQuery } from '@tanstack/react-query';
import { NonFungibleTokenHoldingsList } from '@stacks/blockchain-api-client';
import { getApi } from '@/lib/stacks-api';
import { useNetwork } from '@/lib/use-network';
import { Network,NetworkDetails } from '@/lib/network'; // Import Network type

// Custom hook to fetch NFT holdings for a given address
export const useNftHoldings = (address?: string): UseQueryResult<NonFungibleTokenHoldingsList> => {
  const network: Network = 'testnet'; // Use the Network string type

  const networkDetails: NetworkDetails = {
    chain: 'testnet' as 'testnet', // Explicitly cast to the expected literal type
    explorerUrl: 'https://testnet-explorer.hiro.so',
    coreApiUrl: 'https://api.testnet.hiro.so',
  };

  return useQuery<NonFungibleTokenHoldingsList, Error>({
    queryKey: ['nftHoldings', address],
    queryFn: async () => {
      if (!address) throw new Error('Address is required');
      const api = getApi(network).nonFungibleTokensApi;
      console.log('Fetching NFT holdings for address:', address);
      const response = (await api.getNftHoldings({
        principal: address,
        limit: 200,
      })) as NonFungibleTokenHoldingsList;
      console.log('NFT Holdings Response:', response);
      return response;
    },
    enabled: !!address,
    retry: false,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });
};

// Continuously query a transaction by txId until it is confirmed
export const useGetTxId = (txId: string) => {
  const network = useNetwork();
  return useQuery({
    queryKey: ['nftHoldingsByTxId', txId],
    queryFn: async () => {
      if (!txId) throw new Error('txId is required');
      if (!network) throw new Error('Network is required');
      const api = getApi("testnet").transactionsApi;
      return api.getTransactionById({ txId });
    },
    enabled: !!txId && !!network,
    refetchInterval: (data) => {
      // @ts-expect-error
      return data?.tx_status === 'pending' ? 5000 : false;
    },
    retry: false,
    refetchIntervalInBackground: true,
  });
};

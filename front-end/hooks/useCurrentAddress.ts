import { HiroWalletContext } from '@/components/HiroWalletProvider';
import { useContext } from 'react';

export function useCurrentAddress(): string | null {
  const { network, testnetAddress } = useContext(HiroWalletContext);

  switch (network) {
    case 'testnet':
      return testnetAddress;
    default:
      return null;
  }
}

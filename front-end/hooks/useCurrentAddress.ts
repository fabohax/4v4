import { HiroWalletContext } from '@/components/HiroWalletProvider';
import { useEncryptedWallet } from '@/components/EncryptedWalletProvider';
import { useContext, useEffect, useState } from 'react';

export function useCurrentAddress(): string | null {
  const { network, testnetAddress, mainnetAddress } = useContext(HiroWalletContext);
  const { currentWallet, isAuthenticated } = useEncryptedWallet();
  const [sessionAddress, setSessionAddress] = useState<string | null>(null);

  // Check for session address in localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const session = localStorage.getItem('4v4_session');
        if (session) {
          const parsed = JSON.parse(session);
          if (parsed.address && parsed.encrypted) {
            setSessionAddress(parsed.address);
          }
        }
      } catch (error) {
        console.error('Failed to parse session data:', error);
      }
    }
  }, []);

  // Priority order: 
  // 1. Authenticated encrypted wallet
  // 2. Session address from localStorage  
  // 3. Hiro wallet addresses based on network
  if (isAuthenticated && currentWallet?.address) {
    return currentWallet.address;
  }
  
  if (sessionAddress) {
    return sessionAddress;
  }
  
  // Fallback to Hiro wallet
  switch (network) {
    case 'mainnet':
      return mainnetAddress;
    case 'testnet':
      return testnetAddress;
    default:
      return testnetAddress || mainnetAddress || null;
  }
}

'use client';
import { createContext, FC, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { getPersistedNetwork, persistNetwork } from '@/lib/network';
import { Network } from '@/lib/network';
import { showConnect, disconnect, isConnected, getLocalStorage } from '@stacks/connect';
import { checkForStaleDevnetConnections } from '@/lib/sessionUtils';

interface HiroWallet {
  isWalletOpen: boolean;
  isWalletConnected: boolean;
  testnetAddress: string | null;
  mainnetAddress: string | null;
  currentAddress: string | null; // <-- add this
  network: Network | null;
  setNetwork: (network: Network) => void;
  authenticate: () => void;
  disconnect: () => void;
  clearAllSessions: () => void;
}

const HiroWalletContext = createContext<HiroWallet>({
  isWalletOpen: false,
  isWalletConnected: false,
  testnetAddress: null,
  mainnetAddress: null,
  currentAddress: null, // <-- add this
  network: 'mainnet',
  setNetwork: () => {},
  authenticate: () => {},
  disconnect: () => {},
  clearAllSessions: () => {},
});

interface ProviderProps {
  children: ReactNode | ReactNode[];
}

export const HiroWalletProvider: FC<ProviderProps> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [network, setNetwork] = useState<Network | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);

  const updateNetwork = useCallback((newNetwork: Network) => {
    setNetwork(newNetwork);
    persistNetwork(newNetwork);
  }, []);

  // Function to clear all wallet sessions and storage
  const clearAllWalletSessions = useCallback(() => {
    console.log('Clearing all wallet sessions and storage...');
    
    if (typeof window !== 'undefined') {
      // Clear all wallet-related storage
      const keysToRemove = [
        'blockstack-session',
        'blockstack',
        'connect-session', 
        'stacks-wallet-connect',
        'xverse-stacks',
        'xverse-session',
        'leather-stacks',
        'leather-session'
      ];
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear any other potential wallet storage
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.includes('wallet') || key.includes('stacks') || key.includes('blockstack'))) {
          localStorage.removeItem(key);
        }
      }
      
      sessionStorage.clear();
    }
    
    // Reset all state
    setIsWalletConnected(false);
    setCurrentAddress('');
    setNetwork(null);
    setIsWalletOpen(false);
  }, []);

  useEffect(() => {
    const loadStacksConnect = async () => {
      try {
        setMounted(true);
        
        // Check for stale devnet connections and clear if found
        const hadStaleConnections = checkForStaleDevnetConnections();
        if (hadStaleConnections) {
          // Early return as page will reload
          return;
        }
        
        // Check if we should clear stale sessions on startup
        const shouldClearSessions = typeof window !== 'undefined' && 
          localStorage.getItem('force-clear-sessions');
        if (shouldClearSessions) {
          clearAllWalletSessions();
          localStorage.removeItem('force-clear-sessions');
        }
        
        setIsWalletConnected(isConnected());
      } catch (error) {
        console.error('Failed to load @stacks/connect:', error);
      }
    };

    loadStacksConnect();
  }, [clearAllWalletSessions]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setNetwork(getPersistedNetwork());
    }
  }, []);

  const authenticate = useCallback(async () => {
    try {
      setIsWalletOpen(true);
      console.log('Attempting to connect wallet...');
      
      // First, clear any stale sessions to prevent network conflicts
      console.log('Clearing any stale wallet sessions before connecting...');
      if (typeof window !== 'undefined') {
        // Clear potentially conflicting storage
        localStorage.removeItem('blockstack-session');
        localStorage.removeItem('connect-session');
        
        // Clear network-specific storage that might force devnet
        localStorage.removeItem('stacks-network');
        localStorage.removeItem('stacks-connect-network');
        localStorage.removeItem('blockstack-network');
        
        const win = window as { XverseProviders?: { StacksProvider: unknown }; LeatherProvider?: unknown };
        if (win.XverseProviders?.StacksProvider) {
          console.log('Xverse wallet detected');
          // Clear Xverse-specific stale data and network info
          localStorage.removeItem('xverse-stacks');
          localStorage.removeItem('xverse-session');
          localStorage.removeItem('xverse-network');
          localStorage.removeItem('xverse-stacks-network');
          
          // Clear any devnet-specific storage
          const xverseKeys = Object.keys(localStorage).filter(key => 
            key.includes('xverse') && (key.includes('devnet') || key.includes('ST3'))
          );
          xverseKeys.forEach(key => localStorage.removeItem(key));
          
        } else if (win.LeatherProvider) {
          console.log('Leather wallet detected');
          // Clear Leather-specific stale data  
          localStorage.removeItem('leather-stacks');
          localStorage.removeItem('leather-session');
          localStorage.removeItem('leather-network');
        }
      }
      
      await showConnect({
        appDetails: {
          name: '4V4 NFT Minter',
          icon: typeof window !== 'undefined' ? window.location.origin + '/4V4-DIY.png' : '',
        },
        onFinish: (authData: unknown) => {
          console.log('Wallet connected successfully:', authData);
          
          // Validate that we're connected to the expected network
          const data = getLocalStorage();
          const stxAddresses = data?.addresses?.stx || [];
          const address = stxAddresses.length > 0 ? stxAddresses[0].address : null;
          
          if (address) {
            // Check for specific devnet addresses (well-known devnet faucet addresses)
            const knownDevnetAddresses = [
              'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', // Common devnet faucet
              'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5',  // Another common devnet address
              'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',  // Another devnet address
            ];
            
            if (knownDevnetAddresses.includes(address)) {
              console.warn('⚠️  Connected to known devnet address:', address);
              console.warn('⚠️  Please connect with a testnet wallet instead');
              
              // Clear connection and force reconnect
              disconnect();
              setIsWalletConnected(false);
              
              // Show warning and clear all sessions
              if (typeof window !== 'undefined') {
                alert('Warning: Connected to devnet address. Please use a testnet wallet and reconnect.');
                clearAllWalletSessions();
              }
              return;
            } else if (address.startsWith('ST')) {
              console.log('✅ Connected to testnet address:', address);
            } else if (address.startsWith('SP')) {
              console.log('✅ Connected to mainnet address:', address);
            } else {
              console.log('ℹ️  Connected to address:', address);
            }
          }
          
          setIsWalletConnected(true);
        },
        onCancel: () => {
          console.log('User cancelled wallet connection');
          setIsWalletConnected(false);
        },
      });
      setIsWalletOpen(false);
      
      // Double-check connection status
      const connected = isConnected();
      console.log('Final connection status:', connected);
      setIsWalletConnected(connected);
    } catch (error) {
      console.log('Connection process ended');
      
      // Handle specific error types silently
      if (error instanceof Error) {
        if (error.message.includes('User canceled') || 
            error.message.includes('user cancelled') ||
            error.message.includes('JsonRpcError: User canceled the request')) {
          console.log('User canceled wallet connection - this is normal behavior');
          setIsWalletOpen(false);
          setIsWalletConnected(false);
          return;
        }
        console.error('Connection failed with error:', error.message);
      } else {
        console.error('Connection failed:', error);
      }
      
      setIsWalletOpen(false);
      setIsWalletConnected(false);
    }
  }, [clearAllWalletSessions]);

  const handleDisconnect = useCallback(() => {
    console.log('Disconnecting wallet and clearing all sessions...');
    
    // Disconnect from Stacks Connect
    disconnect();
    
    // Clear all wallet-related local storage
    if (typeof window !== 'undefined') {
      // Clear Stacks Connect storage
      localStorage.removeItem('blockstack-session');
      localStorage.removeItem('blockstack');
      localStorage.removeItem('connect-session');
      localStorage.removeItem('stacks-wallet-connect');
      
      // Clear network-specific storage
      localStorage.removeItem('stacks-network');
      localStorage.removeItem('stacks-connect-network');
      localStorage.removeItem('blockstack-network');
      
      // Clear any Xverse-specific storage
      localStorage.removeItem('xverse-stacks');
      localStorage.removeItem('xverse-session');
      localStorage.removeItem('xverse-network');
      localStorage.removeItem('xverse-stacks-network');
      
      // Clear any Leather-specific storage
      localStorage.removeItem('leather-stacks');
      localStorage.removeItem('leather-session');
      localStorage.removeItem('leather-network');
      
      // Clear any other potential wallet storage
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.includes('wallet') || key.includes('stacks') || key.includes('blockstack'))) {
          localStorage.removeItem(key);
        }
      }
      
      // Also clear session storage
      sessionStorage.clear();
    }
    
    // Reset component state
    setIsWalletConnected(false);
    setCurrentAddress('');
    setNetwork(null);
    
    console.log('Wallet disconnected and all sessions cleared');
  }, []);

  useEffect(() => {
    if (isWalletConnected) {
      const data = getLocalStorage();
      const stxAddresses = data?.addresses?.stx || [];
      const address = stxAddresses.length > 0 ? stxAddresses[0].address : null;
      setCurrentAddress(address || null);
    } else {
      setCurrentAddress(null);
    }
  }, [isWalletConnected]);

  const { testnetAddress, mainnetAddress } = useMemo(() => {
    if (!isWalletConnected) return { testnetAddress: null, mainnetAddress: null };

    const data = getLocalStorage();
    const stxAddresses = data?.addresses?.stx || [];

    // On connect there is only 1 address, which is the current address
    const address = stxAddresses.length > 0 ? stxAddresses[0].address : null;

    const isTestnet = address?.startsWith('ST');
    const isMainnet = address?.startsWith('SP');

    return {
      testnetAddress: isTestnet ? address : null,
      mainnetAddress: isMainnet ? address : null,
    };
  }, [isWalletConnected]);

  const value = useMemo(
    () => ({
      isWalletOpen,
      isWalletConnected,
      testnetAddress,
      mainnetAddress,
      currentAddress, // <-- add this
      network,
      setNetwork: updateNetwork,
      authenticate,
      disconnect: handleDisconnect,
      clearAllSessions: clearAllWalletSessions,
    }),
    [
      isWalletOpen,
      isWalletConnected,
      testnetAddress,
      mainnetAddress,
      currentAddress, // <-- add this
      network,
      authenticate,
      handleDisconnect,
      updateNetwork,
      clearAllWalletSessions,
    ]
  );

  if (!mounted) {
    return null;
  }

  return <HiroWalletContext.Provider value={value}>{children}</HiroWalletContext.Provider>;
};

export { HiroWalletContext };
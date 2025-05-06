'use client';

import { createContext, FC, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Network } from '@/lib/network';
import { AppConfig, showConnect, UserSession, AuthOptions, StacksProvider } from '@stacks/connect';

interface HiroWallet {
  isWalletOpen: boolean;
  isWalletConnected: boolean;
  testnetAddress: string | null;
  mainnetAddress: string | null;
  network: Network | null;
  authenticatedUser: string | null; // Add authenticated user state
  setNetwork: (network: Network) => void;
  authenticate: () => void;
  disconnect: () => void;
}

const HiroWalletContext = createContext<HiroWallet>({
  isWalletOpen: false,
  isWalletConnected: false,
  testnetAddress: null,
  mainnetAddress: null,
  network: null,
  authenticatedUser: null,
  setNetwork: () => {},
  authenticate: () => {},
  disconnect: () => {},
});

interface ProviderProps {
  children: ReactNode | ReactNode[];
}

export const HiroWalletProvider: FC<ProviderProps> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  const [stacksConnect, setStacksConnect] = useState<((authOptions: AuthOptions, provider?: StacksProvider) => Promise<void>) | null>(null);
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [network, setNetwork] = useState<Network>('testnet'); // Default to testnet
  const [authenticatedUser, setAuthenticatedUser] = useState<string | null>(null); // Add state for authenticated user
  const [testnetAddress, setTestnetAddress] = useState<string | null>(null); // Add state for testnet address
  const [mainnetAddress, setMainnetAddress] = useState<string | null>(null); // Add state for mainnet address

  const updateNetwork = useCallback((newNetwork: Network) => setNetwork(newNetwork), []);

  useEffect(() => {
    const loadStacksConnect = async () => {
      try {
        const appConfig = new AppConfig(['store_write', 'publish_data']);
        const session = new UserSession({ appConfig });

        // Ensure showConnect is properly initialized
        setStacksConnect(() => async (authOptions: AuthOptions) => {
          if (!authOptions || typeof authOptions.onFinish !== 'function') {
            throw new Error('Invalid options passed to showConnect');
          }
          await showConnect(authOptions);
        });

        setUserSession(session);
        setMounted(true);
        setIsWalletConnected(session.isUserSignedIn());
      } catch (error) {
        console.error('Failed to load @stacks/connect:', error);
      }
    };

    loadStacksConnect();
  }, []);

  useEffect(() => {
    if (userSession?.isUserSignedIn()) {
      const userData = userSession.loadUserData();
      setTestnetAddress(userData?.profile?.stxAddress?.testnet || null);
      setMainnetAddress(userData?.profile?.stxAddress?.mainnet || null);
    }
  }, [userSession]);

  const authenticate = useCallback(() => {
    if (!stacksConnect || !userSession) return;

    setIsWalletOpen(true);
    try {
      stacksConnect({
        appDetails: {
          name: '4v4',
          icon: ``,
        },
        redirectTo: '/',
        onFinish: () => {
          setIsWalletOpen(false);
          setIsWalletConnected(userSession.isUserSignedIn());
          const userData = userSession.loadUserData();
          setAuthenticatedUser(userData?.profile?.username || null); // Update authenticated user

          // Update addresses immediately after authentication
          setTestnetAddress(userData?.profile?.stxAddress?.testnet || null);
          setMainnetAddress(userData?.profile?.stxAddress?.mainnet || null);
        },
        onCancel: () => setIsWalletOpen(false),
        userSession,
      });
    } catch (error) {
      console.error('Error during wallet authentication:', error);
      setIsWalletOpen(false);
    }
  }, [stacksConnect, userSession]);

  const disconnect = useCallback(() => {
    if (userSession) {
      userSession.signUserOut(window.location.toString());
      setIsWalletConnected(false);
      setAuthenticatedUser(null); // Clear authenticated user
      setTestnetAddress(null); // Clear testnet address
      setMainnetAddress(null); // Clear mainnet address
    }
  }, [userSession]);

  const value = useMemo(
    () => ({
      isWalletOpen,
      isWalletConnected,
      testnetAddress,
      mainnetAddress,
      network,
      authenticatedUser, // Include authenticated user in context
      setNetwork: updateNetwork,
      authenticate,
      disconnect,
    }),
    [
      isWalletOpen,
      isWalletConnected,
      testnetAddress,
      mainnetAddress,
      network,
      authenticatedUser,
      authenticate,
      disconnect,
      updateNetwork,
    ]
  );

  if (!mounted) return null;

  return <HiroWalletContext.Provider value={value}>{children}</HiroWalletContext.Provider>;
};

export { HiroWalletContext };

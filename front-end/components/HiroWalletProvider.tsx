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
    }
  }, [userSession]);

  const testnetAddress = useMemo(() => {
    if (userSession?.isUserSignedIn()) {
      return userSession.loadUserData()?.profile?.stxAddress?.testnet || null;
    }
    return null;
  }, [userSession]);

  const mainnetAddress = useMemo(() => {
    if (userSession?.isUserSignedIn()) {
      return userSession.loadUserData()?.profile?.stxAddress?.mainnet || null;
    }
    return null;
  }, [userSession]);

  const value = useMemo(
    () => ({
      isWalletOpen,
      isWalletConnected,
      testnetAddress,
      mainnetAddress,
      network,
      setNetwork: updateNetwork,
      authenticate,
      disconnect,
    }),
    [isWalletOpen, isWalletConnected, testnetAddress, mainnetAddress, network, authenticate, disconnect, updateNetwork]
  );

  if (!mounted) return null;

  return <HiroWalletContext.Provider value={value}>{children}</HiroWalletContext.Provider>;
};

export { HiroWalletContext };

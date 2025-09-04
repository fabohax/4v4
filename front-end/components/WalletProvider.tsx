'use client'
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface WalletContextType {
  address: string | null;
  setAddress: (address: string | null) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);

  // Persist wallet address for Xverse and Leather
  useEffect(() => {
    // On mount, restore address if present
    const saved = localStorage.getItem('walletAddress');
    if (saved && !address) {
      setAddress(saved);
    }
  }, [address]);

  useEffect(() => {
    if (address) {
      localStorage.setItem('walletAddress', address);
    } else {
      localStorage.removeItem('walletAddress');
    }
  }, [address]);

  // Optionally, check if extension is still available (Xverse/Leather)
  // and clear address if not. This is a simple check:
  useEffect(() => {
    if (!address) return;
    type CustomWindow = Window & {
      XverseProviders?: { StacksProvider?: unknown };
      xverse?: unknown;
      BitcoinProvider?: unknown;
      LeatherProvider?: unknown;
    };
    const win = window as CustomWindow;
    const hasXverse = !!(win.XverseProviders?.StacksProvider || win.xverse || win.BitcoinProvider);
    const hasLeather = !!win.LeatherProvider;
    if (!hasXverse && !hasLeather) {
      setAddress(null);
    }
  }, [address]);

  return (
    <WalletContext.Provider value={{ address, setAddress }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within a WalletProvider');
  return ctx;
}

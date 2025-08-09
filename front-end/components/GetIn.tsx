'use client';

import { useContext, useState, useEffect } from 'react';
import { HiroWalletContext } from './HiroWalletProvider';
import { useEncryptedWallet } from './EncryptedWalletProvider';
import { Button } from '@/components/ui/button';
import GetInModal from './GetInModal';
import UserModal from './UserModal';

interface GetInButtonProps {
  children?: React.ReactNode;
  [key: string]: unknown;
}

export const GetInButton = (buttonProps: GetInButtonProps) => {
  const { children } = buttonProps;
  const [showUserModal, setShowUserModal] = useState(false);
  const [showGetInModal, setShowGetInModal] = useState(false);
  const [isSessionLoggedIn, setIsSessionLoggedIn] = useState(false);
  const {
    isWalletConnected,
  } = useContext(HiroWalletContext);
  const { isAuthenticated: isEncryptedAuthenticated } = useEncryptedWallet();

  // Clean all existing sessions on component mount
  useEffect(() => {
    const cleanAllSessions = () => {
      if (typeof window !== "undefined") {
        // Clear encrypted wallet sessions
        localStorage.removeItem('ezstx_session');
        localStorage.removeItem('ezstx_session_config');
        localStorage.removeItem('ezstx_session_locked');
        localStorage.removeItem('ezstx_encrypted_wallet');
        
        // Clear Hiro wallet sessions
        localStorage.removeItem('blockstack-session');
        localStorage.removeItem('blockstack');
        localStorage.removeItem('connect-session');
        localStorage.removeItem('stacks-wallet-connect');
        
        // Clear other wallet sessions
        localStorage.removeItem('xverse-stacks');
        localStorage.removeItem('xverse-session');
        localStorage.removeItem('leather-stacks');
        localStorage.removeItem('leather-session');
        
        // Clear network-specific keys
        localStorage.removeItem('stacks-network');
        localStorage.removeItem('stacks-connect-network');
        localStorage.removeItem('blockstack-network');
        localStorage.removeItem('xverse-network');
        localStorage.removeItem('xverse-stacks-network');
        localStorage.removeItem('leather-network');
        
        // Clear any remaining wallet-related storage
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && (key.includes('wallet') || key.includes('stacks') || key.includes('blockstack') || key.includes('ezstx'))) {
            localStorage.removeItem(key);
          }
        }
        
        // Clear session storage
        sessionStorage.clear();
        
        console.log('All sessions cleared successfully');
      }
    };
    
    cleanAllSessions();
  }, []); // Run once on mount

  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkSession = () => {
        try {
          const session = localStorage.getItem('ezstx_session');
          const hasSession = !!session;
          console.log('Session check after cleanup:', hasSession, session); // Debug log
          setIsSessionLoggedIn(hasSession);
        } catch {
          setIsSessionLoggedIn(false);
        }
      };
      
      // Initial check (after cleanup)
      setTimeout(checkSession, 100); // Small delay to ensure cleanup completed
      
      // Listen for storage changes
      window.addEventListener('storage', checkSession);

      // Also listen for route changes to update session state after navigation
      const handleVisibility = () => checkSession();
      window.addEventListener('visibilitychange', handleVisibility);

      // Listen for custom event after login
      window.addEventListener('ezstx-session-update', checkSession);

      return () => {
        window.removeEventListener('storage', checkSession);
        window.removeEventListener('visibilitychange', handleVisibility);
        window.removeEventListener('ezstx-session-update', checkSession);
      };
    }
  }, []);

  // Listen for disconnect to update session state
  useEffect(() => {
    if (!isWalletConnected) {
      const session = localStorage.getItem('ezstx_session');
      if (!session) setIsSessionLoggedIn(false);
    }
  }, [isWalletConnected]);

  return (
    <>
      {(isSessionLoggedIn || isWalletConnected || isEncryptedAuthenticated) ? (
        <div className='fixed top-8 right-8 z-100'>
          <button
            type="button"
            className="w-9 h-9 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full p-4 cursor-pointer select-none"
            onClick={() => setShowUserModal(true)}
            aria-label="Profile"
          >
          </button>
          {showUserModal && <UserModal onClose={() => setShowUserModal(false)} />}
        </div>
      ) : (
        <div className='fixed top-7 right-6 z-100'>
          <Button
            onClick={() => setShowGetInModal(true)}
            className="title rounded-full px-6 py-4 text-sm bg-[#E9E9E9] hover:bg-black text-black hover:text-white border-2 border-black hover:border-2 hover:border-white cursor-pointer select-none"
            {...buttonProps}
          >
            {children || 'GET IN'}
          </Button>
        </div>
      )}
      {showGetInModal && <GetInModal onClose={() => setShowGetInModal(false)} />}
    </>
  );
};

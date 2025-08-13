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
        // Clear all wallet sessions
        localStorage.removeItem('4v4_session');
        localStorage.removeItem('4v4_session_config');
        localStorage.removeItem('4v4_session_locked');
        localStorage.removeItem('4v4_encrypted_wallet');
        localStorage.removeItem('blockstack-session');
        localStorage.removeItem('connect-session');
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
          const session = localStorage.getItem('4v4_session');
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
      window.addEventListener('4v4-session-update', checkSession);

      return () => {
        window.removeEventListener('storage', checkSession);
        window.removeEventListener('visibilitychange', handleVisibility);
        window.removeEventListener('4v4-session-update', checkSession);
      };
    }
  }, []);

  // Listen for disconnect to update session state
  useEffect(() => {
    if (!isWalletConnected) {
      const session = localStorage.getItem('4v4_session');
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

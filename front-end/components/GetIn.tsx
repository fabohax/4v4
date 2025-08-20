'use client';

import { useContext, useState, useEffect } from 'react';
import { HiroWalletContext } from './HiroWalletProvider';
import { useEncryptedWallet } from './EncryptedWalletProvider';
import { Button } from '@/components/ui/button';
import GetInModal from './GetInModal';
import UserModal from './UserModal';
import { User } from 'lucide-react';
import Image from 'next/image';
import { getProfile, Profile } from '@/lib/profileApi';
import { getIPFSUrl } from '@/lib/pinataUpload';

interface GetInButtonProps {
  children?: React.ReactNode;
  [key: string]: unknown;
}

export const GetInButton = (buttonProps: GetInButtonProps) => {
  const { children } = buttonProps;
  const [showUserModal, setShowUserModal] = useState(false);
  const [showGetInModal, setShowGetInModal] = useState(false);
  const [isSessionLoggedIn, setIsSessionLoggedIn] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const {
    isWalletConnected,
    mainnetAddress,
    testnetAddress,
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

  // Get current address from session or wallet
  useEffect(() => {
    let address = null;
    
    // Check session address first
    if (typeof window !== "undefined") {
      try {
        const session = localStorage.getItem('4v4_session');
        if (session) {
          const parsed = JSON.parse(session);
          if (parsed.address) address = parsed.address;
        }
      } catch {}
    }
    
    // Fallback to wallet addresses
    if (!address) {
      address = mainnetAddress || testnetAddress || null;
    }
    
    setCurrentAddress(address);
  }, [isSessionLoggedIn, mainnetAddress, testnetAddress]);

  // Load profile when address changes
  useEffect(() => {
    if (!currentAddress) {
      setProfile(null);
      return;
    }
    
    const fetchProfile = async () => {
      try {
        const profileData = await getProfile(currentAddress);
        setProfile(profileData);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        setProfile(null);
      }
    };
    
    fetchProfile();
  }, [currentAddress]);

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
        <div className='fixed top-8 right-4 md:right-8 z-100'>
          <button
            type="button"
            className="w-9 h-9 bg-gradient-to-br from-muted to-muted-foreground/50 rounded-full overflow-hidden cursor-pointer select-none transition-all duration-200 flex items-center justify-center"
            onClick={() => setShowUserModal(true)}
            aria-label="Profile"
          >
            {profile?.avatar_cid ? (
              <img
                src={getIPFSUrl(profile.avatar_cid)}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to User icon if image fails to load
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    const fallback = parent.querySelector('.fallback-icon');
                    if (fallback) fallback.classList.remove('hidden');
                  }
                }}
              />
            ) : profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt="Profile"
                width={36}
                height={36}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-4 h-4 text-white/60" />
            )}
            {/* Fallback icon for IPFS load errors */}
            <User className="w-4 h-4 text-white/60 fallback-icon hidden" />
          </button>
          {showUserModal && <UserModal onClose={() => setShowUserModal(false)} />}
        </div>
      ) : (
        <div className='fixed top-7 right-4 md:right-8 z-100'>
          <Button
            onClick={() => setShowGetInModal(true)}
            className="title rounded-full px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm bg-accent-foreground hover:bg-accent-foreground text-primary-foreground cursor-pointer select-none"
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

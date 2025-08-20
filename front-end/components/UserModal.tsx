'use client'
import React, { useContext, useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, Settings, HelpCircle, LogOut, User } from 'lucide-react';
import { HiroWalletContext } from './HiroWalletProvider';
import { useRouter } from 'next/navigation';
import Image from "next/image";
import { getPersistedNetwork } from '@/lib/network';
import { getApiUrl } from '@/lib/stacks-api';
import { getProfile, Profile } from '@/lib/profileApi';
import { getIPFSUrl } from '@/lib/pinataUpload';

interface UserModalProps {
  onClose: () => void;
}

export default function UserModal({ onClose }: UserModalProps) {
  const { mainnetAddress, testnetAddress, disconnect } = useContext(HiroWalletContext);
  const [balance, setBalance] = useState<string | null>(null);
  const [sessionAddress, setSessionAddress] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const router = useRouter();

  // Check for session user
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const session = localStorage.getItem('4v4_session');
        if (session) {
          const parsed = JSON.parse(session);
          if (parsed.address) setSessionAddress(parsed.address);
        }
      } catch {}
    }
  }, []);

  // Use session address if present, else fallback to HiroWalletContext
  const currentAddress = sessionAddress || mainnetAddress || testnetAddress || null;

  // Fetch balance from Hiro API (recommended endpoint)
  useEffect(() => {
    if (!currentAddress) {
      setBalance(null);
      return;
    }
    
    const network = getPersistedNetwork();
    const baseApiUrl = getApiUrl(network);
    const apiUrl = `${baseApiUrl}/extended/v1/address/${currentAddress}/balances?unanchored=false`;
    
    const fetchBalance = async () => {
      try {
        console.log(`Fetching balance for ${currentAddress} on ${network}:`, apiUrl);
        const res = await fetch(apiUrl, { method: "GET" });
        const data = await res.json();
        // STX balance is in microstacks, convert to STX
        setBalance(
          data.stx && data.stx.balance
            ? (Number(data.stx.balance) / 1e6).toLocaleString()
            : '0'
        );
      } catch (error) {
        console.error('Failed to fetch balance:', error);
        setBalance('--');
      }
    };
    fetchBalance();
  }, [currentAddress]);

  // Fetch profile for avatar display
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

  const truncateMiddle = (str: string | null) => {
    if (!str) return '';
    if (str.length <= 12) return str;
    return `${str.slice(0, 4)}~${str.slice(-4)}`;
  };

  const handleSignOut = () => {
    // Clear the 4v4 session
    if (typeof window !== "undefined") {
      localStorage.removeItem('4v4_session');
      window.dispatchEvent(new Event("4v4-session-update"));
    }
    
    // Disconnect the wallet using the provider's disconnect method
    disconnect();
    
    // Close the modal
    onClose();
    
    // Redirect to home page after disconnect
    router.push('/');

    // Refresh the page to update UI state
    if (typeof window !== "undefined") {
      setTimeout(() => window.location.reload(), 200);
    }
  };

  return (
    <div className="fixed top-10 right-4 z-[200]">

      <div className="relative text-white rounded-3xl p-4 w-[340px] flex flex-col items-center shadow-xl pointer-events-auto z-[201] opacity-0 translate-y-[-24px] animate-getinmodal backdrop-blur-md border border-white/20">
        <div className="flex items-center w-full mb-6">
          {getPersistedNetwork() !== 'mainnet' && (
            <div className="text-xs text-gray-400 text-center m-3 mt-4">
              {getPersistedNetwork().toUpperCase()}
            </div>
          )}
          <Link
            href={`/${currentAddress}`}
            className="title mr-4 text-right text-white text-xl font-bold tracking-wider flex-1 cursor-pointer select-none"
            onClick={onClose}
          >
            {profile?.username || profile?.display_name || truncateMiddle(currentAddress)}
          </Link>
          <div className='flex'>
            <button
              type="button"
              className="w-9 h-9 bg-gradient-to-br from-[#111] to-[#333] border-[1px] border-[#555] rounded-full overflow-hidden cursor-pointer select-none flex items-center justify-center"
              onClick={onClose}
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
          </div>
        </div>
        <div className="w-full mb-4">
          <div className="flex items-center justify-between bg-white/5 backdrop-blur-sm rounded-xl px-6 py-4 mb-2 border border-white/10">
            <button
              onClick={() => { onClose(); router.push('/wallet'); }}
              className="title text-2xl font-bold text-left text-white hover:underline cursor-pointer select-none"
              style={{ background: "none", border: "none", padding: 0, margin: 0 }}
            >
              {balance === null ? (
                <Image
                  src="/loaderb.gif"
                  alt="Loading..."
                  width={48}
                  height={24}
                  unoptimized
                  style={{ minWidth: 48, minHeight: 24, width: 48, height: 24 }}
                  className="inline-block align-middle"
                />
              ) : (
                <>
                  {balance} <span className="text-lg">STX</span>
                </>
              )}
            </button>
            <button
              onClick={() => { onClose(); router.push('/wallet'); }}
              className="text-base text-white/50 text-right hover:underline cursor-pointer select-none"
              style={{ background: "none", border: "none", padding: 0, margin: 0 }}
            >
              Balance
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 w-full mb-2 font-sans text-base">
          <button
            onClick={() => { onClose(); router.push('/notifications'); }}
            className="flex flex-col items-center justify-center bg-white/5 backdrop-blur-sm rounded-xl py-4 text-sm text-white hover:bg-white/7 border border-white/10 cursor-pointer select-none"
          >
            <Bell className="mb-2" size={20} />
            Notifications
          </button>
          <button
            onClick={() => { onClose(); router.push('/settings'); }}
            className="flex flex-col items-center justify-center bg-white/5 backdrop-blur-sm rounded-xl py-4 text-sm text-white hover:bg-white/7 border border-white/10 cursor-pointer select-none"
          >
            <Settings className="mb-2" size={20} />
            Settings
          </button>
          <button
            onClick={() => { onClose(); router.push('/support'); }}
            className="flex flex-col items-center justify-center bg-white/5 backdrop-blur-sm rounded-xl py-4 text-sm text-white hover:bg-white/7 border border-white/10 cursor-pointer select-none"
          >
            <HelpCircle className="mb-2" size={20} />
            Help
          </button>
          <button
            className="flex flex-col items-center justify-center bg-white/5 backdrop-blur-sm rounded-xl py-4 text-white text-sm hover:bg-white/7 border border-white/10 cursor-pointer select-none"
            onClick={handleSignOut}
          >
            <LogOut className="text-white mb-2" size={20} />
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
}

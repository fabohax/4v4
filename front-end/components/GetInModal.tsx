import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from 'next/link';
import { useWallet } from './WalletProvider';
import { useEncryptedWallet } from './EncryptedWalletProvider';
import { Button } from '@/components/ui/button';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CircleHelp, X, Shield } from 'lucide-react';
import { createStacksAccount } from '@/lib/stacksWallet';
import { useRouter } from 'next/navigation';
import { PasswordInput } from '@/components/PasswordInput';
import ConnectModal from './ConnectModal';
import { formatStxAddress } from '@/lib/address-utils';

export default function GetInModal({ onClose }: { onClose?: () => void }) {
  const { address } = useWallet();
  const { 
    isWalletEncrypted, 
    isAuthenticated: isEncryptedAuthenticated,
    isSessionLocked,
    createEncryptedWallet,
    unlockWallet,
    authError: encryptedAuthError,
    isLoading: encryptedLoading,
    walletInfo
  } = useEncryptedWallet();
  const router = useRouter();

  const [walletError] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEncryptedWalletFlow, setShowEncryptedWalletFlow] = useState(false);
  const [encryptedWalletMode, setEncryptedWalletMode] = useState<'unlock' | 'create'>('unlock');

  useEffect(() => {
    if (address && onClose) {
      onClose();
    }
  }, [address, onClose]);

  useEffect(() => {
    if (isEncryptedAuthenticated && onClose) {
      onClose();
    }
  }, [isEncryptedAuthenticated, onClose]);


  const handleEncryptedWalletSubmit = async (password: string, email?: string) => {
    try {
      if (encryptedWalletMode === 'create') {
        // Generate new wallet data for encryption
        const { mnemonic, stxPrivateKey, address } = await createStacksAccount();
        const walletData = {
          mnemonic,
          privateKey: stxPrivateKey,
          address,
          label: '4V4 Wallet'
        };
        await createEncryptedWallet(walletData, password);
        
        // Save to Supabase if email provided
        if (email) {
          try {
            console.log('Attempting to save account to database...');
            const response = await fetch('/api/save-account', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email,
                passkey: stxPrivateKey, 
                password,
                address
              }),
            });
            
            const result = await response.json();
            
            if (!response.ok) {
              console.warn('Failed to save account to database:', result);
              console.warn('Account creation will continue without database save');
              // Don't throw error - continue with wallet creation even if DB save fails
            } else {
              console.log('Account saved to database successfully:', result);
            }
          } catch (dbError) {
            console.warn('Database save error:', dbError);
            console.warn('Account creation will continue without database save');
            // Don't throw error - continue with wallet creation even if DB save fails
          }

          // Send confirmation email with address
          try {
            const mailRes = await fetch('/api/wallet-connect/account-created', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, address }),
            });
            const mailResult = await mailRes.json();
            if (!mailRes.ok) {
              console.warn('Failed to send confirmation email:', mailResult);
            } else {
              console.log('Confirmation email sent:', mailResult);
            }
          } catch (mailError) {
            console.warn('Error sending confirmation email:', mailError);
          }
        }
        
        // Redirect to welcome page with email
        const emailParam = email ? `?email=${encodeURIComponent(email)}` : '';
        router.push(`/welcome${emailParam}`);
        if (onClose) onClose();
      } else {
        await unlockWallet(password);
        if (walletInfo) {
          // For existing wallets, redirect to the address page
          router.push(`/${walletInfo.address}`);
          if (onClose) onClose();
        }
      }
    } catch (error) {
      // Error will be handled by the PassphraseInput component
      console.error('Encrypted wallet operation failed:', error);
    }
  };

  const handleShowEncryptedWallet = () => {
    setEncryptedWalletMode(isWalletEncrypted ? 'unlock' : 'create');
    setShowEncryptedWalletFlow(true);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] select-none">
      <div
        className="bg-white text-black rounded-[21px] w-[360px] pt-8 pb-0 px-0 shadow-2xl flex flex-col items-center
          transition-all duration-300 ease-out
          opacity-0 translate-y-[-24px] animate-getinmodal border border-[#555]"
      >
        {/* Header */}
        <div className="w-full grid grid-cols-3 gap-0 relative mb-6 px-6">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="justify-start bg-none border-none text-[#555] text-sm cursor-pointer" aria-label="Help" type="button">
                  <CircleHelp className="h-[18px]"/>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs text-sm z-100">
                <div>
                  Connect or create your account using your wallet or seed phrase.<br />
                  <span className="text-background underline">
                    <a href="/support" target="_blank" rel="noopener noreferrer">Need help? Visit Support</a>
                  </span>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="title text-center font-semibold text-lg text-black tracking-wider flex items-center justify-center select-none">
            Get In
          </div>
          <div className="flex items-center justify-end">
            <button onClick={onClose} className="bg-none border-none text-[#555] text-xl cursor-pointer" aria-label="Close" type="button">
              <X className="h-[18px]"/>
            </button>
          </div>
        </div>
        {/* Auth Options - Conditional rendering based on flow */}
        <div className="w-full flex flex-col gap-3 px-6 mb-3">
          {/* Auth options: Connect Wallet, Encrypted Wallet, Email, Mnemonic */}
          {showEncryptedWalletFlow ? (
            /* Encrypted Wallet Flow */
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-black mb-2">
                  {encryptedWalletMode === 'create' ? 'Secure Your Wallet' : 
                   isSessionLocked ? 'Unlock Your Wallet' : 'Access Your Wallet'}
                </h3>
                <p className="text-sm text-gray-400">
                  {encryptedWalletMode === 'create' 
                    ? 'Create a password to encrypt your wallet locally'
                    : 'Enter your password to unlock your encrypted wallet'
                  }
                </p>
              </div>
              
              <PasswordInput
                mode={encryptedWalletMode}
                onSubmit={handleEncryptedWalletSubmit}
                isLoading={encryptedLoading}
                error={encryptedAuthError}
                showStrengthIndicator={encryptedWalletMode === 'create'}
                confirmRequired={encryptedWalletMode === 'create'}
                onCancel={() => setShowEncryptedWalletFlow(false)}
              />

              {encryptedWalletMode === 'unlock' && (
                <div className="flex flex-col gap-2 mt-4">
                  <Button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        localStorage.removeItem('4v4_session');
                        localStorage.removeItem('4v4_session_config');
                        localStorage.removeItem('4v4_session_locked');
                        localStorage.removeItem('4v4_encrypted_session');
                        localStorage.removeItem('4v4_encrypted_wallet');
                        localStorage.removeItem('blockstack-session');
                        localStorage.removeItem('connect-session');
                        sessionStorage.clear();
                        window.location.reload();
                      }
                    }}
                    className="w-full h-10 rounded-[7px] bg-transparent text-[#555] text-sm border cursor-pointer flex items-center px-4 hover:bg-transparent hover:text-red-700 mt-2"
                    type="button"
                  >
                    Clear All Sessions
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* Main Auth Options */
            <>
              {/* Connect Wallet */}
              <div>
                <Button
                  onClick={() => setShowImportModal(true)}
                  className="w-full h-12 rounded-[9px] bg-[#111] text-white font-semibold text-base border border-foreground cursor-pointer flex items-center px-4 hover:bg-[#000]"
                  type="button"
                >
                  <Image src="/wallet-ico.svg" alt="Wallet" width={18} height={18} className="invert mr-2"/>
                  <span className="text-center flex-1">Connect Wallet</span>
                </Button>
                {walletError && (
                  <div className="text-red-500 text-xs mt-2 text-center">{walletError}</div>
                )}
              </div>
              {/* Encrypted Wallet Option */}
              <div>
                <Button
                  onClick={handleShowEncryptedWallet}
                  className="w-full h-12 rounded-[9px] bg-[#2563eb] text-white font-semibold text-base border border-[#2563eb] cursor-pointer flex items-center px-4 hover:bg-[#1d4ed8]"
                  type="button"
                >
                  <Shield className="w-[18px] h-[18px] mx-[5px]"/>
                  <span className="text-center flex-1">
                    {isWalletEncrypted && walletInfo 
                      ? `Unlock ${formatStxAddress(walletInfo.address)}` 
                      : 'Create Account'}
                  </span>
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Import Wallet Modal */}
        {showImportModal && (
          <ConnectModal
            onClose={() => setShowImportModal(false)}
            onSuccess={() => {
              setShowImportModal(false);
              if (onClose) onClose();
            }}
          />
        )}
        {/* Terms */}
        <div className="w-full rounded-b-2xl text-center text-xs text-black tracking-wider p-6 px-8">
          By Signing In, you agree to our <Link href="/terms" className="hover:text-black">Terms of Service</Link> and <Link href="/privacy" className="hover:text-black">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}


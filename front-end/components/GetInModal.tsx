import React, { useContext, useEffect, useState } from "react";
import Image from "next/image";
import Link from 'next/link';
import { HiroWalletContext } from './HiroWalletProvider';
import { Button } from '@/components/ui/button';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CircleHelp, X } from 'lucide-react';
import { createStacksAccount } from '@/lib/stacksWallet';
import { useRouter } from 'next/navigation';
import { SeedPhraseInput } from '@/components/SeedPhraseInput';
import { validateAndGenerateWallet } from '@/lib/walletHelpers';

export default function GetInModal({ onClose }: { onClose?: () => void }) {
  const { authenticate, isWalletConnected } = useContext(HiroWalletContext);
  const router = useRouter();

  const [walletError, setWalletError] = useState<string | null>(null);
  const [showSeedInput, setShowSeedInput] = useState(false);
  const [seedValue, setSeedValue] = useState('');

  useEffect(() => {
    if (isWalletConnected && onClose) {
      onClose();
    }
  }, [isWalletConnected, onClose]);

  const handleAuthenticate = async () => {
    setWalletError(null);
    try {
      await authenticate();
    } catch (err: unknown) {
      const errorMessage =
        typeof err === "object" && err !== null && "message" in err && typeof (err as { message?: unknown }).message === "string"
          ? (err as { message: string }).message
          : "";
      if (
        !errorMessage.toLowerCase().includes('user canceled') &&
        !errorMessage.toLowerCase().includes('user cancelled')
      ) {
        setWalletError(errorMessage || 'Failed to connect wallet.');
      }
    }
  };

  const handleSendSeed = async () => {
    try {
      const { privateKey, address } = await validateAndGenerateWallet(seedValue.trim());
      if (!privateKey || !address) throw new Error();
      if (typeof window !== "undefined") {
        localStorage.setItem('ezstx_session', JSON.stringify({ stxPrivateKey: privateKey, address, createdAt: Date.now() }));
        window.dispatchEvent(new Event('ezstx-session-update'));
      }
      router.push(`/${address}`);
      if (onClose) onClose();
    } catch {
      alert('Invalid seed phrase.');
    }
  };

  const handleCreateAccount = async () => {
    try {
      const { mnemonic, stxPrivateKey, address } = await createStacksAccount();
      if (typeof window !== "undefined") {
        sessionStorage.setItem('ezstx_new_wallet', JSON.stringify({ mnemonic, stxPrivateKey, address }));
      }
      router.push('/account');
      if (onClose) onClose();
    } catch {
      alert('Failed to create account.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] select-none">
      <div
        className="bg-[#181818] rounded-[21px] w-[360px] pt-8 pb-0 px-0 shadow-2xl flex flex-col items-center
          transition-all duration-300 ease-out
          opacity-0 translate-y-[-24px] animate-getinmodal"
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
                  <span className="text-[#2563eb] underline">
                    <a href="/support" target="_blank" rel="noopener noreferrer">Need help? Visit Support</a>
                  </span>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="title text-center font-semibold text-lg text-white tracking-wider flex items-center justify-center select-none">
            Get In
          </div>
          <div className="flex items-center justify-end">
            <button onClick={onClose} className="bg-none border-none text-[#555] text-xl cursor-pointer" aria-label="Close" type="button">
              <X className="h-[18px]"/>
            </button>
          </div>
        </div>
        {/* Auth Options - 3 rows */}
        <div className="w-full flex flex-col gap-3 px-6 mb-3">
          {/* Connect Wallet */}
          <div>
            <Button
              onClick={handleAuthenticate}
              className="w-full h-12 rounded-[9px] bg-white text-black font-semibold text-base border border-[#eee] cursor-pointer flex items-center px-4 hover:bg-[#f3f3f3]"
              type="button"
            >
              <Image src="/wallet-ico.svg" alt="Wallet" width={18} height={18} className="mr-2"/>
              <span className="text-center flex-1">Connect Wallet</span>
            </Button>
            {walletError && (
              <div className="text-red-500 text-xs mt-2 text-center">{walletError}</div>
            )}
          </div>
          {/* Create Account */}
          <div>
            <Button
              onClick={handleCreateAccount}
              className="w-full h-12 rounded-[9px] bg-[#2563eb] text-white font-semibold text-base border border-[#2563eb] cursor-pointer flex items-center px-4 hover:bg-[#1d4ed8]"
              type="button"
            >
              <Image src="/add-ico.svg" alt="Seed Phrase" width={18} height={18}/>
              <span className="text-center flex-1">Create Account</span>
            </Button>
          </div>
          {/* Enter Seed Phrase */}
          <div>
            <SeedPhraseInput
              showSeedInput={showSeedInput}
              setShowSeedInput={setShowSeedInput}
              seedValue={seedValue}
              setSeedValue={setSeedValue}
              handleSendSeed={handleSendSeed}
            />
          </div>
        </div>
        {/* Terms */}
        <div className="w-full bg-[#232323] rounded-b-2xl text-center text-xs text-[#aaa] tracking-wider p-6 px-8">
          By Signing In, you agree to our <Link href="/terms" className="hover:text-white">Terms of Service</Link> and <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}


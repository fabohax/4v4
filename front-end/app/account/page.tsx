'use client'
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function AccountCreatedPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState<{ mnemonic: string; stxPrivateKey: string; address: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const data = sessionStorage.getItem("ezstx_new_wallet");
      if (data) setWallet(JSON.parse(data));
    }
  }, []);

  const handleConfirm = () => {
    if (wallet && typeof window !== "undefined") {
      localStorage.setItem(
        "ezstx_session",
        JSON.stringify({
          stxPrivateKey: wallet.stxPrivateKey,
          address: wallet.address,
          createdAt: Date.now(),
        })
      );
      window.dispatchEvent(new Event("ezstx-session-update"));
      router.push(`/${wallet.address}`);
    }
  };

  if (!wallet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-lg text-gray-400">No wallet found. Please create an account first.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="bg-[#111] rounded-2xl p-8 max-w-lg w-full border-[1px] border-[#222] shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-4 text-white">Your Account Has Been Created</h2>
        <div className="mb-4 text-sm bg-white text-black text-center p-4 rounded-lg">
          <b>Important:</b> Save your seed phrase below. You will need them to recover your account. We cannot recover your account if you lose them.
        </div>
        <div className="mb-4">
          <div className="font-semibold text-white mb-1 text-center">Seed Phrase:</div>
          <div className="bg-[#181818] text-white font-mono p-6 rounded break-words text-sm">{wallet.mnemonic}</div>
        </div>
        <Button
          onClick={handleConfirm}
          className="w-full mt-4 bg-[#2563eb] text-white font-semibold rounded-xl py-6 hover:bg-[#1d4ed8] cursor-pointer select-none"
        >
          I&apos;ve saved my credentials, continue
        </Button>
      </div>
    </div>
  );
}

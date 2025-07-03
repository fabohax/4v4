"use client";
import React, { useState, useEffect, useContext } from "react";
import { HiroWalletContext } from "@/components/HiroWalletProvider";
import Image from "next/image";
import { Copy, X } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";


export default function WalletPage() {
  const { mainnetAddress, testnetAddress } = useContext(HiroWalletContext) || {};
  const [sessionAddress, setSessionAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showReceive, setShowReceive] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState("");

  // Get address from session or context
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const session = localStorage.getItem('ezstx_session');
        if (session) {
          const parsed = JSON.parse(session);
          if (parsed.address) setSessionAddress(parsed.address);
        }
      } catch {}
    }
  }, []);
  const address = sessionAddress || mainnetAddress || testnetAddress || "";

  // Fetch balance
  useEffect(() => {
    if (!address) {
      setBalance(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const apiUrl = `https://api.hiro.so/extended/v1/address/${address}/balances?unanchored=false`;
    fetch(apiUrl)
      .then(res => res.json())
      .then(data => {
        setBalance(
          data.stx && data.stx.balance
            ? (Number(data.stx.balance) / 1e6).toLocaleString()
            : '0'
        );
        setLoading(false);
      })
      .catch(() => {
        setBalance('--');
        setLoading(false);
      });
  }, [address]);

  // Send handler
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement send logic
    alert(`Sending ${sendAmount} STX to ${sendTo}`);
    setShowSend(false);
    setSendTo("");
    setSendAmount("");
  };

  // If no session user and no Hiro wallet, ask to connect wallet
  if (!sessionAddress && !mainnetAddress && !testnetAddress) {
    return (
      <div className="max-w-xl mx-auto my-24 p-8 bg-black rounded-2xl border-[1px] border-[#333] shadow text-white flex flex-col items-center justify-center select-none">
        <h1 className="text-3xl font-bold mb-6">Wallet</h1>
        <p className="mb-8 text-lg text-gray-300 text-center">
          Please connect your wallet to manage your funds.
        </p>
        <Link
          href="/"
          className="py-3 px-6 rounded-xl border-[1px] border-[#333] bg-blue-600 text-white hover:bg-white hover:text-black transition-all duration-200 focus:outline-none cursor-pointer select-none"
        >
          Connect Wallet
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto my-24 p-8 bg-black rounded-2xl border-[1px] border-[#333] shadow text-white select-none">
      <h1 className="title text-3xl font-bold mb-8">Wallet</h1>
      <div className="mb-8 flex justify-center">
        <div className="flex items-center gap-3">
          {loading ? (
            <Image
              src="/loaderb.gif"
              alt="Loading..."
              width={32}
              height={16}
              style={{ minWidth: 32, minHeight: 16, width: 32, height: 16 }}
              className="title text-xl inline-block align-middle"
            />
          ) : (
            <span className="title text-2xl font-bold">{balance} <span className="text-lg">STX</span></span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button
          className="bg-transparent border-[1px] border-[#333] text-white w-full px-6 py-3 rounded-xl hover:bg-white hover:text-black cursor-pointer select-none transition-all duration-200"
          onClick={() => setShowSend(true)}
        >
          Send
        </button>
        <button
          className="bg-transparent border-[1px] border-[#333] text-white px-6 py-3 rounded-xl hover:bg-white hover:text-black cursor-pointer select-none transition-all duration-200"
          onClick={() => setShowReceive(true)}
        >
          Receive
        </button>
      </div>
      <div className="mb-8">
        <div className="mb-2 text-gray-400 text-sm font-semibold">Address</div>
        <div className="flex items-center gap-2">
          <span className="font-light font-sm border-[1px] border-[#333] px-4 py-2 rounded-xl text-base break-all select-text">{address}</span>
          <button
            className="text-blue-400 p-1 rounded transition"
            onClick={() => {
              if (address) {
                navigator.clipboard.writeText(address);
                toast.success("Address copied!");
              }
            }}
            aria-label="Copy address"
            type="button"
          >
            <Copy size={18} className="text-white cursor-pointer"/>
          </button>
        </div>
      </div>



      {/* Send Modal */}
      {showSend && (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
          <div className="bg-[#111] text-white p-6 rounded-2xl border border-[#333] shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-end">
                <button onClick={() => setShowSend(false)}
                    className="bg-none border-none text-[#555] text-xl cursor-pointer" aria-label="Close" type="button">
                <X className="h-[18px]"/>
                </button>
            </div>
            <form onSubmit={handleSend} className="space-y-6 mt-6">
              <div>
                <input
                  className="w-full px-6 py-3 rounded-xl border border-[#333] bg-black text-white focus:outline-none"
                  value={sendTo}
                  onChange={e => setSendTo(e.target.value)}
                  required
                  placeholder="Recipient address"
                />
              </div>
              <div>
                <input
                  className="w-full px-6 py-3 rounded-xl border border-[#333] bg-black text-white focus:outline-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0"
                  type="number"
                  min="0"
                  step="any"
                  value={sendAmount}
                  onChange={e => setSendAmount(e.target.value)}
                  required
                  placeholder="Amount in STX"
                  // For Firefox
                  style={{ MozAppearance: "textfield" } as React.CSSProperties}
                />
              </div>
              <div>
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl border-[1px] border-[#333] bg-white text-black transition-all duration-200 focus:outline-none cursor-pointer select-none"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive Modal */}
      {showReceive && (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
          <div className="bg-[#111] text-white p-8 rounded-2xl border border-[#333] shadow-xl w-full max-w-sm text-center">
            <div className="flex items-center justify-end">
              <button
                onClick={() => setShowReceive(false)}
                className="bg-none border-none text-[#555] text-xl cursor-pointer"
                aria-label="Close"
                type="button"
              >
                <X className="h-[18px]" />
              </button>
            </div>
            <h2 className="text-xl font-bold mb-6">Receive</h2>
            <div className="mb-6">
              {address ? (
                <div className="w-full  p-6 flex items-center justify-center rounded-xl bg-white p-0">
                  <QRCodeSVG
                    value={address}
                    width="100%"
                    height="100%"
                    size={256}
                    bgColor="#fff"
                    fgColor="#181818"
                    includeMargin={false}
                    level="M"
                    style={{ width: "100%", height: "auto", maxWidth: 256, maxHeight: 256 }}
                  />
                </div>
              ) : (
                <div className="w-32 h-32 mx-auto bg-gray-800 flex items-center justify-center rounded-xl text-gray-400">
                  QR
                </div>
              )}
            <div className="title bg-[#222] text-lg px-6 py-6 rounded-xl mt-3 break-all select-text">{address}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
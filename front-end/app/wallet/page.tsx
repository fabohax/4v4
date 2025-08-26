"use client";
import React, { useState, useEffect, useContext } from "react";
import { retrieveEncryptedWallet } from "@/lib/encryptedStorage";

// Extend the Window interface to include StacksProvider
declare global {
  interface Window {
    StacksProvider?: unknown;
  }
}
import { getSigningNetwork } from "@/lib/encryptedWalletSigning";
import { makeSTXTokenTransfer, broadcastTransaction } from "@stacks/transactions";
import { HiroWalletContext } from "@/components/HiroWalletProvider";
import { getApiUrl } from "@/lib/stacks-api";
import { getPersistedNetwork } from "@/lib/network";

import Image from "next/image";
import { Copy, X } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { fetchRecentTransactions } from "@/lib/fetchRecentTransactions";

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
  const [sendPassword, setSendPassword] = useState("");
  const [sendLoading, setSendLoading] = useState(false);
  const [extensionAvailable, setExtensionAvailable] = useState(false);
  // Detect if Hiro Wallet extension is available and connected
  useEffect(() => {
    if (typeof window !== 'undefined' && window.StacksProvider) {
      setExtensionAvailable(true);
    } else {
      setExtensionAvailable(false);
    }
  }, [mainnetAddress, testnetAddress, showSend]);

  // Get address from session or context
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
  const address = sessionAddress || mainnetAddress || testnetAddress || "";

  // Fetch balance
  useEffect(() => {
    if (!address) {
      setBalance(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    // Get current network and use appropriate API endpoint
    const currentNetwork = getPersistedNetwork();
    const apiBaseUrl = getApiUrl(currentNetwork);
    const apiUrl = `${apiBaseUrl}/extended/v1/address/${address}/balances?unanchored=false`;
    
    console.log(`Fetching balance from ${currentNetwork} network:`, apiUrl);
    
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
      .catch((error) => {
        console.error('Failed to fetch balance:', error);
        setBalance('--');
        setLoading(false);
      });
  }, [address]);

  // Send handler
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendLoading(true);
    try {
      if (extensionAvailable) {
        try {
          // Use LeatherProvider if available, else fallback to StacksProvider
          const provider = (typeof window !== 'undefined' && (window as any).LeatherProvider)
            ? (window as any).LeatherProvider
            : (typeof window !== 'undefined' && (window as any).StacksProvider)
              ? (window as any).StacksProvider
              : null;
          if (!provider) {
            toast.error('No compatible wallet extension found.');
            setSendLoading(false);
            return;
          }
          // Use the correct LeatherProvider method for STX transfer
          await provider.request(
            "stx_transferStx",
            {
              recipient: sendTo,
              amount: String(Math.round(Number(sendAmount) * 1e6)), // microSTX as string
              memo: '',
            }
          );
          toast.success('Transaction sent via extension!');
          setShowSend(false);
          setSendTo("");
          setSendAmount("");
          setSendPassword("");
        } catch (err: unknown) {
          // Log the error object for debugging
          // eslint-disable-next-line no-console
          console.error('Extension transaction error:', err);
          let errorMsg = 'Extension transaction failed';
          if (err && typeof err === 'object') {
            if ('message' in err && typeof (err as any).message === 'string') {
              errorMsg = (err as any).message;
            } else if ('error' in err && typeof (err as any).error === 'string') {
              errorMsg = (err as any).error;
            } else {
              try {
                errorMsg = JSON.stringify(err);
              } catch {}
            }
          }
          toast.error(errorMsg);
        }
        setSendLoading(false);
        return;
      }
      // 1. Decrypt wallet with password
      const wallet = await retrieveEncryptedWallet(sendPassword);
      if (!wallet || !wallet.privateKey) throw new Error("Invalid password or wallet not found");

      // 2. Prepare transaction
      const network = getSigningNetwork();
      const tx = await makeSTXTokenTransfer({
        recipient: sendTo,
        amount: Math.round(Number(sendAmount) * 1e6),
        senderKey: wallet.privateKey,
        network,
      });

      // 3. Broadcast transaction
      const result = await broadcastTransaction({ transaction: tx, network });
      if ('txid' in result) {
        toast.success(`Transaction sent! TXID: ${result.txid}`);
      } else {
        toast.error(result || 'Broadcast failed');
      }
      setShowSend(false);
      setSendTo("");
      setSendAmount("");
      setSendPassword("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message || 'Failed to send STX');
      } else {
        toast.error('Failed to send STX');
      }
    } finally {
      setSendLoading(false);
    }
  };

  // Recent transactions state
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  // Fetch recent transactions
  useEffect(() => {
    if (!address) {
      setTransactions([]);
      return;
    }
    setTxLoading(true);
    const network = getPersistedNetwork();
    fetchRecentTransactions(address, network, 10)
      .then(setTransactions)
      .catch(() => setTransactions([]))
      .finally(() => setTxLoading(false));
  }, [address, showSend]);


  // If no session user and no Hiro wallet, ask to connect wallet
  if (!sessionAddress && !mainnetAddress && !testnetAddress) {
    return (
  <div className="max-w-xl mx-auto my-24 p-8 rounded-2xl border-[1px] shadow flex flex-col items-center justify-center select-none bg-white dark:bg-black border-gray-200 dark:border-[#333] text-gray-900 dark:text-white">
  <h1 className="text-3xl font-bold mb-6">Wallet</h1>
  <p className="mb-8 text-lg text-gray-600 dark:text-gray-300 text-center">
          Please connect your wallet to manage your funds.
        </p>
        <Link
          href="/"
          className="py-3 px-6 rounded-xl border-[1px] bg-blue-600 text-white hover:bg-white hover:text-blue-600 border-blue-600 dark:border-[#333] transition-all duration-200 focus:outline-none cursor-pointer select-none"
        >
          Connect Wallet
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
  <div className="max-w-xl mx-auto p-8 bg-accent-background rounded-2xl border-[1px] border-[#333] shadow text-accent-foreground select-none min-w-[100vw] lg:min-w-1/4">
      
      <h1 className="title text-3xl font-bold hidden">Wallet</h1>
      <div className="mt-16 flex justify-center">
        <div className="flex items-center gap-3">
          {loading ? (
            <Image
              src="/loaderb.gif"
              alt="Loading..."
              width={32}
              height={16}
              unoptimized
              style={{ minWidth: 32, minHeight: 16, width: 32, height: 16 }}
              className="title text-xl inline-block align-middle"
            />
          ) : (
            <span className="title text-2xl font-bold">{balance} <span className="text-lg">STX</span></span>
          )}
        </div>
      </div>

            {/* Network and Address Info - Only show if not mainnet */}
      {getPersistedNetwork() !== 'mainnet' && (
        <div className="mb-16 p-4 bg-accent-background rounded-lg">
          <div className="flex items-center justify-center text-sm">
            <span className="text-blue-400 text-center uppercase">{getPersistedNetwork()}</span>
          </div>
        </div>
      )}
    
      
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button
          className="bg-background border border-foreground text-accent-foreground w-full px-6 py-3 rounded-xl hover:bg-white hover:text-black cursor-pointer select-none transition-all duration-200"
          onClick={() => setShowSend(true)}
        >
          Send
        </button>
        <button
          className="bg-transparent border-[1px] border-[#333] text-accent-foreground px-6 py-3 rounded-xl hover:bg-white hover:text-black cursor-pointer select-none transition-all duration-200"
          onClick={() => setShowReceive(true)}
        >
          Receive
        </button>
      </div>


      {/* Send Modal */}
      {showSend && (
        <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
          <div className="bg-background text-foreground p-6 rounded-2xl border border-foreground shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-end">
                <button onClick={() => setShowSend(false)}
                    className="bg-none border-none text-[#555] text-xl cursor-pointer" aria-label="Close" type="button">
                <X className="h-[18px]"/>
                </button>
            </div>
            <form onSubmit={handleSend} className="space-y-6 mt-6">
              <div>
                <input
                  className="w-full px-6 py-3 rounded-xl border border-foreground bg-background text-foreground focus:outline-none"
                  value={sendTo}
                  onChange={e => setSendTo(e.target.value)}
                  required
                  placeholder="SP..XYZ"
                  disabled={sendLoading}
                />
              </div>
              <div>
                <input
                  className="w-full px-6 py-8 rounded-xl border border-foreground bg-background text-foreground focus:outline-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0 text-right text-xl"
                  type="number"
                  min="0"
                  step="any"
                  value={sendAmount}
                  onChange={e => setSendAmount(e.target.value)}
                  required
                  placeholder="Amount"
                  disabled={sendLoading}
                  style={{ MozAppearance: "textfield" } as React.CSSProperties}
                />
              </div>
              {/* Only show password input if not using extension or extension is not available */}
              {!extensionAvailable && (
                <div>
                  <input
                    className="w-full px-6 py-3 rounded-xl border border-foreground bg-background text-foreground focus:outline-none"
                    type="password"
                    value={sendPassword}
                    onChange={e => setSendPassword(e.target.value)}
                    required
                    placeholder="Wallet password"
                    disabled={sendLoading}
                  />
                </div>
              )}
              <div>
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl border-[1px] border-foreground bg-background text-foreground transition-all duration-200 focus:outline-none cursor-pointer select-none"
                  disabled={sendLoading}
                >
                  {sendLoading ? (extensionAvailable ? 'Sending via Extension...' : 'Sending...') : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive Modal */}
      {showReceive && (
        <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
          <div className="bg-background text-foreground p-8 rounded-2xl border border-[#333] shadow-xl w-full max-w-sm text-center">
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
                <div className="w-full p-6 flex items-center justify-center rounded-xl bg-background">
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
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-light px-8 py-2 rounded-xl text-sm break-all select-text">{address}</span>
                
              </div>
              <button
                  className="text-center text-foreground text-sm p-1 rounded transition"
                  onClick={() => {
                    if (address) {
                      navigator.clipboard.writeText(address);
                      toast.success("Address copied!");
                    }
                  }}
                  aria-label="Copy address"
                  type="button"
                >
                  <Copy size={18} className="text-accent-foreground cursor-pointer"/>
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
        <div className="bg-background border border-foreground rounded-xl p-4 max-h-96 overflow-y-auto">
          {txLoading ? (
            <div className="flex justify-center items-center py-8">
              <Image src="/loaderb.gif" alt="Loading..." width={32} height={16} unoptimized />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No recent transactions found.</div>
          ) : (
            <ul className="space-y-4">
              {transactions.map((tx) => (
                <li key={tx.tx_id} className="border-b border-gray-200 last:border-b-0 pb-3">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-xs text-gray-700 dark:text-gray-300 break-all">
                        <a href={`https://explorer.stacks.co/txid/${tx.tx_id}?chain=${getPersistedNetwork()}`}
                          target="_blank" rel="noopener noreferrer"
                          className="hover:underline text-blue-600 dark:text-blue-400">
                          {tx.tx_id.slice(0, 10)}...{tx.tx_id.slice(-8)}
                        </a>
                      </div>
                      <div className="text-sm mt-1">
                        {tx.tx_type === 'token_transfer' ? (
                          <>
                            <span className="font-semibold">{tx.sender_address === address ? 'Sent' : 'Received'}</span>
                            {tx.sender_address === address ? (
                              <> to <span className="font-mono">{tx.token_transfer.recipient_address.slice(0, 8)}...{tx.token_transfer.recipient_address.slice(-6)}</span></>
                            ) : (
                              <> from <span className="font-mono">{tx.sender_address.slice(0, 8)}...{tx.sender_address.slice(-6)}</span></>
                            )}
                            <span className="ml-2">{Number(tx.token_transfer.amount) / 1e6} STX</span>
                          </>
                        ) : (
                          <span className="text-gray-500">{tx.tx_type.replace(/_/g, ' ')}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 text-right whitespace-nowrap">
                      {tx.burn_block_time_iso ? new Date(tx.burn_block_time_iso).toLocaleString() : ''}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
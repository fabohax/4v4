import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Upload, Mail, Key } from 'lucide-react';
import { validateAndGenerateWallet } from '@/lib/walletHelpers';
import { useEncryptedWallet } from './EncryptedWalletProvider';
import { useRouter } from 'next/navigation';
import { upsertConnectedAccountPasskey, getConnectedAccountByEmail, getConnectedAccountPasskeyByAddress } from '@/lib/connectedAccountsApi';
// Password verification utility for settings changes
// Usage: await verifyPassphraseForSettings(address, passphrase, privateKey)
export async function verifyPassphraseForSettings(address: string, passphrase: string, privateKey: string): Promise<boolean> {
  try {
    // Fetch stored passkey hash from Supabase
    const storedPasskey = await getConnectedAccountPasskeyByAddress(address);
    if (!storedPasskey) return false;
    // Compute hash of privateKey + passphrase
    const inputHash = CryptoJS.SHA256(privateKey + passphrase).toString();
    // Compare with stored hash
    return storedPasskey === inputHash;
  } catch {
    return false;
  }
}
import CryptoJS from 'crypto-js';

// Extend Window interface for temporary import data
declare global {
  interface Window {
    tempImportData?: {
      mnemonic: string;
      privateKey: string;
      address: string;
      label: string;
    };
  }
}

interface ConnectModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

type ConnectMode = 'email' | 'mnemonic';

export default function ConnectModal({ onClose, onSuccess }: ConnectModalProps) {
  const [connectMode, setConnectMode] = useState<ConnectMode>('email');
  const [mnemonic, setMnemonic] = useState('');
  const [email, setEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [emailMessage, setEmailMessage] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [walletLabel, setWalletLabel] = useState('Imported Wallet');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'import' | 'encrypt'>('import');

  const { createEncryptedWallet } = useEncryptedWallet();
  const router = useRouter();

  const handleMnemonicImport = async () => {
    if (!mnemonic.trim()) {
      setError('Please enter your mnemonic phrase');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Validate mnemonic and generate wallet
      const { privateKey, address } = await validateAndGenerateWallet(mnemonic.trim());
      
      if (!privateKey || !address) {
        throw new Error('Invalid mnemonic phrase');
      }

      // Store temporary data for encryption step
      window.tempImportData = {
        mnemonic: mnemonic.trim(),
        privateKey,
        address,
        label: walletLabel
      };

      setStep('encrypt');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid mnemonic phrase');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEncryptedWallet = async () => {
    if (!passphrase) {
      setError('Please enter a passphrase');
      return;
    }

    if (passphrase !== confirmPassphrase) {
      setError('Passphrases do not match');
      return;
    }

    if (passphrase.length < 8) {
      setError('Passphrase must be at least 8 characters');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const tempData = window.tempImportData;
      if (!tempData) {
        throw new Error('Import data not found');
      }

      // Check if email is already registered in connected_accounts
      if (email) {
        const existingAccount = await getConnectedAccountByEmail(email);
        if (existingAccount) {
          // Email already registered: send connection link and show alert
          setIsLoading(false);
          setError('Email is already registered. A connection link has been sent to your email.');
          try {
            await fetch('/api/wallet-recovery/send-link', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: email.trim() }),
            });
          } catch {}
          return;
        }
      }

      const walletData = {
        mnemonic: tempData.mnemonic,
        privateKey: tempData.privateKey,
        address: tempData.address,
        label: tempData.label
      };

      await createEncryptedWallet(walletData, passphrase);

      // Update connected_accounts: remove previous passkey and insert new one (hash of privateKey + passphrase)
      try {
        const passkeyHash = CryptoJS.SHA256(walletData.privateKey + passphrase).toString();
        await upsertConnectedAccountPasskey(walletData.address, passkeyHash);
      } catch (e) {
        console.warn('Failed to update connected_accounts passkey:', e);
      }
      
      // Clean up temp data
      delete window.tempImportData;

      // Redirect to welcome page with email if available
      const emailParam = email ? `?email=${encodeURIComponent(email)}` : '';
      router.push(`/welcome${emailParam}`);
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to encrypt wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailConnect = async () => {
    if (!email.trim()) {
      setEmailStatus('error');
      setEmailMessage('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailStatus('error');
      setEmailMessage('Please enter a valid email address');
      return;
    }

    try {
      setIsLoading(true);
      setEmailStatus('sending');
      setEmailMessage('');

      const response = await fetch('/api/wallet-recovery/send-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send connection link');
      }

      setEmailStatus('sent');
      setEmailMessage('Connection link sent! Please check your email.');
    } catch (err: unknown) {
      setEmailStatus('error');
      setEmailMessage((err as Error).message || 'Failed to send email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-[101] select-none">
      <div className="bg-background rounded-[21px] w-[480px] max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-foreground flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            Connect Account
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {step === 'import' ? (
            <>
              {/* Connect Mode Selection */}
              <div className="flex gap-2 mb-6">
                <Button
                  variant="outline"
                  onClick={() => setConnectMode('email')}
                  className={`flex-1 cursor-pointer transition-colors ${
                    connectMode === 'email' 
                      ? 'text-foreground border-foreground' 
                      : 'bg-transparent border-transparent'
                  }`}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setConnectMode('mnemonic')}
                  className={`flex-1 cursor-pointer transition-colors ${
                    connectMode === 'mnemonic' 
                      ? 'text-foreground border-foreground' 
                      : ' border-[1px] border-background text-foreground'
                  }`}
                >
                  <Key className="w-4 h-4 mr-2" />
                  Mnemonic
                </Button>
              </div>

              {connectMode === 'email' ? (
                <div className="space-y-4">
                  <div>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="cursor-pointer"
                      disabled={isLoading}
                    />
                  </div>
                  <Button 
                    onClick={handleEmailConnect} 
                    disabled={!email || isLoading} 
                    className="w-full cursor-pointer bg-foreground text-black hover:bg-foreground hover:text-black transition-colors"
                  >
                    {isLoading ? 'Sending...' : 'Send Connection Link'}
                  </Button>
                  {emailMessage && (
                    <div style={{ color: emailStatus === 'error' ? 'red' : 'green', marginTop: 8 }} className="text-sm">
                      {emailMessage}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Wallet Label
                    </label>
                    <Input
                      value={walletLabel}
                      onChange={(e) => setWalletLabel(e.target.value)}
                      placeholder="My Imported Wallet"
                      className="bg-background border-gray-600 text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Mnemonic Phrase (12-24 words)
                    </label>
                    <textarea
                      value={mnemonic}
                      onChange={(e) => setMnemonic(e.target.value)}
                      placeholder="Enter your 12 or 24 word mnemonic phrase..."
                      className="w-full h-32 p-3 bg-background border border-gray-600 rounded-md text-foreground placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Separate words with spaces. Your mnemonic will be encrypted and stored securely.
                    </p>
                  </div>

                  {error && (
                    <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-md">
                      {error}
                    </div>
                  )}

                  <Button
                    onClick={handleMnemonicImport}
                    disabled={isLoading || !mnemonic.trim()}
                    className="w-full cursor-pointer bg-foreground text-black hover:bg-foreground hover:text-black transition-colors disabled:cursor-not-allowed disabled:hover:bg-gray-600 disabled:hover:text-foreground"
                  >
                    {isLoading ? 'Validating...' : 'Import Wallet'}
                  </Button>
                </div>
              )}
            </>
          ) : (
            /* Encryption Step */
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">Secure Your Wallet</h3>
                <p className="text-foreground text-sm">
                  Create a passphrase to encrypt your wallet. This will be required to access your wallet.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Passphrase
                </label>
                <Input
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Enter a secure passphrase"
                  className="bg-background border-gray-600 text-foreground"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Confirm Passphrase
                </label>
                <Input
                  type="password"
                  value={confirmPassphrase}
                  onChange={(e) => setConfirmPassphrase(e.target.value)}
                  placeholder="Confirm your passphrase"
                  className="bg-background border-gray-600 text-foreground"
                />
              </div>

              {error && (
                <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('import')}
                  className="flex-1 cursor-pointer hover:bg-foreground hover:text-black transition-colors"
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button
                  onClick={handleCreateEncryptedWallet}
                  disabled={isLoading || !passphrase || !confirmPassphrase}
                  className="flex-1 cursor-pointer hover:bg-foreground hover:text-black transition-colors disabled:cursor-not-allowed disabled:hover:bg-gray-600 disabled:hover:text-foreground"
                >
                  {isLoading ? 'Creating...' : 'Create Wallet'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

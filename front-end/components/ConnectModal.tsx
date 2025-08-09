import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Upload, Mail, Key } from 'lucide-react';
import { validateAndGenerateWallet } from '@/lib/walletHelpers';
import { useEncryptedWallet } from './EncryptedWalletProvider';
import { useRouter } from 'next/navigation';

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
  const [emailStatus, setEmailStatus] = useState('');
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

      const walletData = {
        mnemonic: tempData.mnemonic,
        privateKey: tempData.privateKey,
        address: tempData.address,
        label: tempData.label
      };

      await createEncryptedWallet(walletData, passphrase);
      
      // Clean up temp data
      delete window.tempImportData;

      // Redirect to profile page
      router.push('/profile');
      
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
      setEmailStatus('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailStatus('Please enter a valid email address');
      return;
    }

    try {
      setIsLoading(true);
      setEmailStatus('');

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

      setEmailStatus('Connection link sent! Please check your email.');
    } catch {
      setEmailStatus('Error: Failed to send connection link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[101] select-none">
      <div className="bg-[#181818] rounded-[21px] w-[480px] max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            Connect Account
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
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
                      ? 'bg-white text-black hover:bg-gray-100 border-white' 
                      : 'bg-transparent border-transparent hover:bg-white hover:text-black hover:border-white'
                  }`}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email Connect
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setConnectMode('mnemonic')}
                  className={`flex-1 cursor-pointer transition-colors ${
                    connectMode === 'mnemonic' 
                      ? 'bg-white text-black hover:bg-gray-100 border-white' 
                      : 'bg-transparent border-transparent hover:bg-white hover:text-black hover:border-white'
                  }`}
                >
                  <Key className="w-4 h-4 mr-2" />
                  Mnemonic Import
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
                    className="w-full cursor-pointer bg-white text-black hover:bg-white hover:text-black transition-colors"
                  >
                    {isLoading ? 'Sending...' : 'Send Connection Link'}
                  </Button>
                  {emailStatus && (
                    <div className={`text-sm ${emailStatus.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
                      {emailStatus}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Wallet Label
                    </label>
                    <Input
                      value={walletLabel}
                      onChange={(e) => setWalletLabel(e.target.value)}
                      placeholder="My Imported Wallet"
                      className="bg-[#2a2a2a] border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Mnemonic Phrase (12-24 words)
                    </label>
                    <textarea
                      value={mnemonic}
                      onChange={(e) => setMnemonic(e.target.value)}
                      placeholder="Enter your 12 or 24 word mnemonic phrase..."
                      className="w-full h-32 p-3 bg-[#2a2a2a] border border-gray-600 rounded-md text-white placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full cursor-pointer bg-white text-black hover:bg-white hover:text-black transition-colors disabled:cursor-not-allowed disabled:hover:bg-gray-600 disabled:hover:text-white"
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
                <h3 className="text-lg font-semibold text-white mb-2">Secure Your Wallet</h3>
                <p className="text-gray-300 text-sm">
                  Create a passphrase to encrypt your wallet. This will be required to access your wallet.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Passphrase
                </label>
                <Input
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Enter a secure passphrase"
                  className="bg-[#2a2a2a] border-gray-600 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Passphrase
                </label>
                <Input
                  type="password"
                  value={confirmPassphrase}
                  onChange={(e) => setConfirmPassphrase(e.target.value)}
                  placeholder="Confirm your passphrase"
                  className="bg-[#2a2a2a] border-gray-600 text-white"
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
                  className="flex-1 cursor-pointer hover:bg-white hover:text-black transition-colors"
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button
                  onClick={handleCreateEncryptedWallet}
                  disabled={isLoading || !passphrase || !confirmPassphrase}
                  className="flex-1 cursor-pointer hover:bg-white hover:text-black transition-colors disabled:cursor-not-allowed disabled:hover:bg-gray-600 disabled:hover:text-white"
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

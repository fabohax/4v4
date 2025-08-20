/**
 * Passphrase Signing Modal
 * Allows encrypted wallet users to sign transactions with their passphrase
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Eye, EyeOff, Lock, AlertTriangle, X } from 'lucide-react';
import { useEncryptedWallet } from './EncryptedWalletProvider';

interface PassphraseSigningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSign: (passphrase: string) => Promise<void>;
  title?: string;
  description?: string;
  actionText?: string;
  isLoading?: boolean;
}

export const PassphraseSigningModal: React.FC<PassphraseSigningModalProps> = ({
  isOpen,
  onClose,
  onSign,
  title = "Sign Transaction",
  description = "Enter your wallet passphrase to sign this transaction.",
  actionText = "Sign",
  isLoading = false,
}) => {
  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { walletInfo } = useEncryptedWallet();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passphrase.trim()) {
      setError('Please enter your passphrase');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      await onSign(passphrase);
      setPassphrase(''); // Clear passphrase for security
      // Let parent component handle success and modal close
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Signing failed';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [passphrase, onSign]);

  const handleClose = useCallback(() => {
    if (isProcessing || isLoading) return;
    setPassphrase('');
    setError('');
    onClose();
  }, [isProcessing, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 w-full max-w-md mx-4 z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isProcessing || isLoading}
            className="h-8 w-8 p-0 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {description}
        </p>

        {/* Wallet Info */}
        {walletInfo && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 bg-gray-50 dark:bg-gray-800/50 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="font-medium">{walletInfo.label}</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 font-mono">
              {walletInfo.address.substring(0, 8)}...{walletInfo.address.substring(walletInfo.address.length - 8)}
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mb-4">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="signing-passphrase" className="text-sm font-medium text-gray-900 dark:text-white">
              Wallet Passphrase
            </label>
            <div className="relative">
              <input
                id="signing-passphrase"
                type={showPassphrase ? 'text' : 'password'}
                placeholder="Enter your wallet passphrase"
                value={passphrase}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassphrase(e.target.value)}
                disabled={isProcessing || isLoading}
                className="w-full pr-10 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                autoComplete="new-password"
                autoFocus
              />
              <button
                type="button"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                onClick={() => setShowPassphrase(!showPassphrase)}
                disabled={isProcessing || isLoading}
              >
                {showPassphrase ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isProcessing || isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!passphrase.trim() || isProcessing || isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isProcessing || isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Signing...
                </>
              ) : (
                actionText
              )}
            </button>
          </div>
        </form>

        {/* Security Notice */}
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
          Your passphrase is used locally and never sent to our servers.
        </div>
      </div>
    </div>
  );
};

export default PassphraseSigningModal;

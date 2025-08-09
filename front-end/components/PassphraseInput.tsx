/**
 * Passphrase Input Component for Encrypted Wallet Authentication
 * Provides secure passphrase entry with strength validation and user feedback
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Lock, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import { validatePassphraseStrength } from '@/lib/encryptedStorage';

interface PassphraseInputProps {
  onSubmit: (passphrase: string, email?: string) => Promise<void>;
  mode: 'unlock' | 'create' | 'change';
  isLoading?: boolean;
  error?: string | null;
  placeholder?: string;
  showStrengthIndicator?: boolean;
  autoFocus?: boolean;
  onCancel?: () => void;
  confirmRequired?: boolean;
}

export const PassphraseInput: React.FC<PassphraseInputProps> = ({
  onSubmit,
  mode,
  isLoading = false,
  error = null,
  placeholder = 'Enter your passphrase',
  showStrengthIndicator = false,
  autoFocus = true,
  onCancel,
  confirmRequired = false,
}) => {
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [email, setEmail] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [strengthInfo, setStrengthInfo] = useState<{
    isValid: boolean;
    score: number;
    feedback: string[];
  } | null>(null);
  const [touched, setTouched] = useState(false);

  // Validate passphrase strength in real-time for create/change modes
  useEffect(() => {
    if ((mode === 'create' || mode === 'change') && passphrase && showStrengthIndicator) {
      const info = validatePassphraseStrength(passphrase);
      setStrengthInfo(info);
    } else {
      setStrengthInfo(null);
    }
  }, [passphrase, mode, showStrengthIndicator]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passphrase.trim()) return;
    
    // Validate email for create mode
    if (mode === 'create' && !email.trim()) {
      return; // Email is required for account creation
    }
    
    // Validate email format for create mode
    if (mode === 'create' && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return; // Invalid email format
      }
    }
    
    // Validate passphrase match for create/change modes
    if (confirmRequired && passphrase !== confirmPassphrase) {
      return; // Error will be shown by validation logic below
    }
    
    // Validate strength for create/change modes
    if ((mode === 'create' || mode === 'change') && strengthInfo && !strengthInfo.isValid) {
      return; // Error will be shown by strength indicator
    }
    
    try {
      await onSubmit(passphrase, mode === 'create' ? email : undefined);
      // Clear form on success
      setPassphrase('');
      setConfirmPassphrase('');
      setEmail('');
      setTouched(false);
    } catch (error) {
      // Error will be displayed via props
      console.error('Passphrase submission failed:', error);
    }
  };

  const getStrengthColor = (score: number): string => {
    if (score <= 2) return 'bg-red-500';
    if (score <= 4) return 'bg-yellow-500';
    if (score <= 6) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthText = (score: number): string => {
    if (score <= 2) return 'Weak';
    if (score <= 4) return 'Fair';
    if (score <= 6) return 'Good';
    return 'Strong';
  };

  const passphraseMatch = !confirmRequired || passphrase === confirmPassphrase;
  const emailValid = mode !== 'create' || (email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  const isFormValid = passphrase.trim() && 
    emailValid &&
    (!confirmRequired || (confirmPassphrase && passphraseMatch)) &&
    (!strengthInfo || strengthInfo.isValid);

  return (
    <div className="w-full space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Input - Only for create mode */}
        {mode === 'create' && (
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
              <AlertCircle className="h-4 w-4" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="border-[#333] focus:border-blue-500"
              disabled={isLoading}
              autoComplete="email"
              required
            />
            <p className="text-xs text-gray-400">
              Your email will be used to securely store your encrypted account information.
            </p>
          </div>
        )}

        {/* Main Passphrase Input */}
        <div className="space-y-2">
          <Label htmlFor="passphrase" className="flex items-center gap-2 text-sm font-medium">
            <Lock className="h-4 w-4" />
            {mode === 'unlock' ? 'Enter Passphrase' : 
             mode === 'create' ? 'Create Passphrase' : 'New Passphrase'}
          </Label>
          <div className="relative">
            <Input
              id="passphrase"
              type={showPassphrase ? 'text' : 'password'}
              value={passphrase}
              onChange={(e) => {
                setPassphrase(e.target.value);
                if (!touched) setTouched(true);
              }}
              placeholder={placeholder}
              className="pr-12 border-[#333] focus:border-blue-500"
              autoFocus={autoFocus}
              disabled={isLoading}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassphrase(!showPassphrase)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
              disabled={isLoading}
            >
              {showPassphrase ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Confirm Passphrase Input */}
        {confirmRequired && (
          <div className="space-y-2">
            <Label htmlFor="confirmPassphrase" className="flex items-center gap-2 text-sm font-medium">
              <Shield className="h-4 w-4" />
              Confirm Passphrase
            </Label>
            <div className="relative">
              <Input
                id="confirmPassphrase"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassphrase}
                onChange={(e) => setConfirmPassphrase(e.target.value)}
                placeholder="Confirm your passphrase"
                className={`pr-12 border-[#333] focus:border-blue-500 ${
                  confirmPassphrase && !passphraseMatch ? 'border-red-500' : ''
                }`}
                disabled={isLoading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
                disabled={isLoading}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassphrase && !passphraseMatch && (
              <p className="text-red-400 text-xs flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Passphrases do not match
              </p>
            )}
          </div>
        )}

        {/* Strength Indicator */}
        {showStrengthIndicator && strengthInfo && touched && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Passphrase Strength:</span>
              <span className={`font-medium ${strengthInfo.isValid ? 'text-green-400' : 'text-red-400'}`}>
                {getStrengthText(strengthInfo.score)}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(strengthInfo.score)}`}
                style={{ width: `${(strengthInfo.score / 7) * 100}%` }}
              />
            </div>
            {strengthInfo.feedback.length > 0 && (
              <div className="space-y-1">
                {strengthInfo.feedback.map((feedback, index) => (
                  <p key={index} className="text-yellow-400 text-xs flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {feedback}
                  </p>
                ))}
              </div>
            )}
            {strengthInfo.isValid && (
              <p className="text-green-400 text-xs flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Passphrase meets security requirements
              </p>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={!isFormValid || isLoading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {mode === 'unlock' ? 'Unlocking...' : 
                 mode === 'create' ? 'Creating...' : 'Changing...'}
              </div>
            ) : (
              <>
                {mode === 'unlock' ? 'Unlock Wallet' : 
                 mode === 'create' ? 'Create Encrypted Wallet' : 'Change Passphrase'}
              </>
            )}
          </Button>
          
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="border-[#333] hover:bg-[#333]"
            >
              Cancel
            </Button>
          )}
        </div>
      </form>

      {/* Security Notice */}
      {mode === 'create' && (
        <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <p className="text-blue-400 text-xs flex items-start gap-2">
            <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              Your passphrase encrypts your private keys locally. Make sure to remember it - 
              it cannot be recovered if lost. Consider using a password manager.
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

export default PassphraseInput;

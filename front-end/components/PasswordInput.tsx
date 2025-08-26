/**
 * Password Input Component for Encrypted Wallet Authentication
 * Provides secure password entry with strength validation and user feedback
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Lock, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import { validatePassphraseStrength } from '@/lib/encryptedStorage';

interface PasswordInputProps {
  onSubmit: (password: string, email?: string) => Promise<void>;
  mode: 'unlock' | 'create' | 'change';
  isLoading?: boolean;
  error?: string | null;
  placeholder?: string;
  showStrengthIndicator?: boolean;
  autoFocus?: boolean;
  onCancel?: () => void;
  confirmRequired?: boolean;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  onSubmit,
  mode,
  isLoading = false,
  error = null,
  placeholder = 'Enter your password',
  showStrengthIndicator = false,
  autoFocus = true,
  onCancel,
  confirmRequired = false,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [strengthInfo, setStrengthInfo] = useState<{
    isValid: boolean;
    score: number;
    feedback: string[];
  } | null>(null);
  const [touched, setTouched] = useState(false);

  // Validate password strength in real-time for create/change modes
  useEffect(() => {
    if ((mode === 'create' || mode === 'change') && password && showStrengthIndicator) {
      const info = validatePassphraseStrength(password);
      setStrengthInfo(info);
    } else {
      setStrengthInfo(null);
    }
  }, [password, mode, showStrengthIndicator]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) return;
    
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
    
    // Validate password match for create/change modes
    if (confirmRequired && password !== confirmPassword) {
      return; // Error will be shown by validation logic below
    }
    
    // Validate strength for create/change modes
    if ((mode === 'create' || mode === 'change') && strengthInfo && !strengthInfo.isValid) {
      return; // Error will be shown by strength indicator
    }
    
    try {
      await onSubmit(password, mode === 'create' ? email : undefined);
      // Clear form on success
      setPassword('');
      setConfirmPassword('');
      setEmail('');
      setTouched(false);
    } catch (error) {
      // Error will be displayed via props
      console.error('Password submission failed:', error);
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

  const passwordMatch = !confirmRequired || password === confirmPassword;
  const emailValid = mode !== 'create' || (email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  const isFormValid = password.trim() && 
    emailValid &&
    (!confirmRequired || (confirmPassword && passwordMatch)) &&
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

        {/* Main Password Input */}
        <div className="space-y-2">
          <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium">
            <Lock className="h-4 w-4" />
            {mode === 'unlock' ? 'Enter Password' : 
             mode === 'create' ? 'Create Password' : 'New Password'}
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
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
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
              disabled={isLoading}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Confirm Password Input */}
        {confirmRequired && (
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-sm font-medium">
              <Shield className="h-4 w-4" />
              Confirm Password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className={`pr-12 border-[#333] focus:border-blue-500 ${
                  confirmPassword && !passwordMatch ? 'border-red-500' : ''
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
            {confirmPassword && !passwordMatch && (
              <p className="text-red-400 text-xs flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Passwords do not match
              </p>
            )}
          </div>
        )}

        {/* Strength Indicator */}
        {showStrengthIndicator && strengthInfo && touched && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Password Strength:</span>
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
                Password meets security requirements
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
            className="flex-1 text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                 mode === 'create' ? 'Create Wallet' : 'Change Password'}
              </>
            )}
          </Button>
          
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="bg-transparent border-[#333] hover:bg-[#fff] cursor-pointer"
            >
              Cancel
            </Button>
          )}
        </div>
      </form>

      {/* Security Notice */}
      {mode === 'create' && (
        <div className="p-3 bg-transparent border border-blue-500/30 rounded-lg">
          <p className="text-blue-400 text-xs flex items-start gap-2">
            <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              Your password encrypts your private keys locally. Make sure to remember it - 
              it cannot be recovered if lost. Consider using a password manager.
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

export default PasswordInput;

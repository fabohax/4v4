'use client';

import { useState } from "react";

export default function PasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  // Example API token (replace with real value as needed)
  const apiToken = "db56bc37c095100774ddee34058eec8f";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // Simulate save
    setTimeout(() => setSaving(false), 1000);
  };

  return (
    <div className="max-w-xl mx-auto my-24 p-8 bg-black rounded-2xl border-[1px] border-[#333] shadow text-white">
      <h1 className="text-3xl font-bold mb-8">Change your account password</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block mb-2 text-sm font-semibold">Current password</label>
          <input
            className="w-full px-4 py-2 rounded-xl border border-[#333] focus:outline-none"
            type="password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            placeholder="Current password"
            autoComplete="current-password"
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-semibold">New password</label>
          <input
            className="w-full px-4 py-2 rounded-xl border border-[#333] focus:outline-none"
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="New password"
            minLength={10}
            autoComplete="new-password"
          />
          <div className="text-xs text-[#aaa] mt-1">
            Must be at least 10 characters long. Don&apos;t tell it to anyone. Seriously.
          </div>
        </div>
        <div>
          <label className="block mb-2 text-sm font-semibold">Confirm new password</label>
          <input
            className="w-full px-4 py-2 rounded-xl border border-[#333] focus:outline-none"
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            autoComplete="new-password"
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-semibold">API token</label>
          <input
            className="w-full px-4 py-2 rounded-xl border border-[#333] bg-[#222] text-[#bbb] focus:outline-none"
            type="text"
            value={apiToken}
            readOnly
          />
          <div className="text-xs text-[#aaa] mt-1">
            Your private API token lets you upload 3D models from exporters and other applications directly to your account.
          </div>
        </div>
        <button
          type="submit"
          className="w-full py-3 px-4 rounded-xl border-[1px] border-[#00b6e3] bg-[#00b6e3] text-white hover:bg-white hover:text-[#00b6e3] transition-all duration-200 focus:outline-none cursor-pointer select-none font-bold"
        >
          {saving ? 'Changing...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}

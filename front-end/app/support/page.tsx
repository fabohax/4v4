"use client";
import React, { useState } from "react";
import { useI18n } from '@/lib/i18n';

export default function SupportPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 2000);
    setEmail("");
    setMessage("");
  };

  return (
    <div className="max-w-xl mx-auto my-24 p-8 bg-surface-primary rounded-2xl border-[1px] border-border shadow text-foreground">
      <h1 className="text-3xl font-bold mb-8">{t('Support')}</h1>
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">{t('Contact Us')}</h2>
        <p className="text-muted-foreground mb-2">
          {t('For help, questions, or feedback, email us at')}{" "}
          <a href="mailto:40230@pm.me" className="text-blue-400 hover:underline">
            40230@pm.me
          </a>
        </p>
        <p className="text-muted-foreground text-sm">
          {t('We usually respond within 24 hours.')}
        </p>
      </div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">{t('FAQ')}</h2>
        <ul className="text-muted-foreground text-sm space-y-2">
          <li>
            <span className="font-semibold text-foreground">{t('How do I reset my password?')}</span>
            <br />
            {t('Go to')} <span className="text-blue-400">{t('Settings')} &gt; {t('Change Password')}</span>.
          </li>
          <li>
            <span className="font-semibold text-foreground">{t('How do I contact support?')}</span>
            <br />
            {t('Use the form below or email us directly.')}
          </li>
          <li>
            <span className="font-semibold text-foreground">{t('Where can I find documentation?')}</span>
            <br />
            {t('Visit our')} <a href="https://4v4.xyz/docs" className="text-blue-400 hover:underline">{t('documentation page')}</a>.
          </li>
        </ul>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">{t('Send us a message')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full px-4 py-2 rounded-xl border border-border bg-surface-primary text-foreground focus:outline-none"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={t('Your email')}
            required
          />
          <textarea
            className="w-full px-4 py-2 rounded-xl border border-border bg-surface-primary text-foreground focus:outline-none"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder={t('How can we help you?')}
            rows={4}
            required
          />
          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl border-[1px] border-border bg-primary text-primary-foreground hover:bg-muted hover:text-foreground transition-all duration-200 focus:outline-none cursor-pointer select-none"
            disabled={sent}
          >
            {sent ? t('Message sent!') : t('Send Message')}
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";
import React, { useState } from "react";

export default function SupportPage() {
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
    <div className="max-w-xl mx-auto my-24 p-8 bg-black rounded-2xl border-[1px] border-[#333] shadow text-white">
      <h1 className="text-3xl font-bold mb-8">Support</h1>
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Contact Us</h2>
        <p className="text-gray-300 mb-2">
          For help, questions, or feedback, email us at{" "}
          <a href="mailto:support@ezstx.app" className="text-blue-400 hover:underline">
            support@4v4.diy
          </a>
        </p>
        <p className="text-gray-400 text-sm">
          We usually respond within 24 hours.
        </p>
      </div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">FAQ</h2>
        <ul className="text-gray-300 text-sm space-y-2">
          <li>
            <span className="font-semibold text-white">How do I reset my password?</span>
            <br />
            Go to <span className="text-blue-400">Settings &gt; Change Password</span>.
          </li>
          <li>
            <span className="font-semibold text-white">How do I contact support?</span>
            <br />
            Use the form below or email us directly.
          </li>
          <li>
            <span className="font-semibold text-white">Where can I find documentation?</span>
            <br />
            Visit our <a href="https://ezstx.app/docs" className="text-blue-400 hover:underline">documentation page</a>.
          </li>
        </ul>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">Send us a message</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full px-4 py-2 rounded-xl border border-[#333] bg-black text-white focus:outline-none"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Your email"
            required
          />
          <textarea
            className="w-full px-4 py-2 rounded-xl border border-[#333] bg-black text-white focus:outline-none"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="How can we help you?"
            rows={4}
            required
          />
          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl border-[1px] border-[#333] bg-blue-600 text-white hover:bg-white hover:text-blue-600 transition-all duration-200 focus:outline-none cursor-pointer select-none"
            disabled={sent}
          >
            {sent ? "Message sent!" : "Send Message"}
          </button>
        </form>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function JoinWaitlistForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch("/api/join-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSuccess(true);
        setEmail("");
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong.");
      }
    } catch {
      setError("Network error.");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 p-12 bg-[#111] rounded-lg shadow-lg w-full max-w-md mx-auto">
      <h2 className="title text-xl font-bold mb-2">Join the Waitlist</h2>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
        className="px-6 py-3 rounded-md bg-[#111] text-white border border-[#fff] w-full"
      />
      <Button type="submit" disabled={loading || !email} className="w-full p-6 rounded-md border-[1px] border-[#333] text-white">
        {loading ? "Joining..." : "Join"}
      </Button>
      {success && <p className="text-green-400">You&apos;ve been added to the waitlist!</p>}
      {error && <p className="text-red-400">{error}</p>}
    </form>
  );
}

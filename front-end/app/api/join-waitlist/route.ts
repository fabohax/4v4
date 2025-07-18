import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email || typeof email !== "string") {
    return new Response(JSON.stringify({ error: "Invalid email" }), { status: 400 });
  }
  try {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      cc: "40230@protonmail.com",
      subject: "Welcome to the Waitlist!",
      html: `
<div style="background:#18181b;padding:32px 24px;border-radius:16px;color:#fff;font-family:Chakra Petch,sans-serif;text-align:center;max-width:480px;margin:auto;">
  <h1 style="font-size:2rem;font-weight:700;margin-bottom:12px;letter-spacing:1px;">Welcome to the 4V4.DIY Waitlist!</h1>
  <p style="font-size:1.1rem;margin-bottom:18px;">Hey <b>${email}</b>,</p>
  <p style="font-size:1rem;margin-bottom:18px;">We're excited to have you join the revolution in 3D avatars and digital collectibles.<br />
  You'll be the first to know about exclusive drops, updates, and early access opportunities.</p>
  <div style="margin:24px 0;">
    <a href="https://4v4.diy" style="display:inline-block;padding:12px 32px;background:#ff006a;color:#fff;border-radius:8px;font-weight:600;text-decoration:none;font-size:1.1rem;box-shadow:0 2px 8px #0002;">Visit 4V4.DIY</a>
  </div>
  <hr style="border:none;border-top:1px solid #333;margin:32px 0;" />
  <p style="color:#898989;font-size:13px;">CYPUNK REVOLT &mdash; The future of avatars is yours.</p>
</div>
`
    });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch {
    return new Response(JSON.stringify({ error: "Failed to join waitlist." }), { status: 500 });
  }
}

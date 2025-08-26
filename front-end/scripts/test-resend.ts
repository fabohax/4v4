// scripts/test-resend.ts
// Usage: npx tsx scripts/test-resend.ts
// Requires: npm install resend

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function main() {
  const to = process.env.RESEND_TEST_TO || 'fabohax@gmail.com';
  const from = process.env.RESEND_TEST_FROM || 'onboarding@resend.dev'; // or your verified sender
  try {
    const data = await resend.emails.send({
      from,
      to,
      subject: 'Test Email from Resend',
      html: '<h1>This is a test email sent via Resend API.</h1>'
    });
    console.log('Resend API response:', data);
  } catch (err) {
    console.error('Error sending email:', err);
    process.exit(1);
  }
}

main();

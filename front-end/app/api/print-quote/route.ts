import { Resend } from 'resend';

const allowedExtensions = new Set(['stl', 'obj', '3mf', 'step', 'stp', 'zip']);
const maxFileSize = 10 * 1024 * 1024;
const emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

function safe(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const name = String(form.get('name') ?? '').trim();
    const email = String(form.get('email') ?? '').trim();
    const quantity = String(form.get('quantity') ?? '').trim();
    const size = String(form.get('size') ?? '').trim();
    const sizeUnit = String(form.get('sizeUnit') ?? '').trim();
    const details = String(form.get('details') ?? '').trim();
    const model = form.get('model');

    if (!name || name.length > 100 || !emailPattern.test(email) || email.length > 254) {
      return Response.json({ error: 'Enter a valid name and email address.' }, { status: 400 });
    }
    if (!/^\d{1,4}$/.test(quantity) || Number(quantity) < 1 || Number(quantity) > 1000 || details.length < 5 || details.length > 2000) {
      return Response.json({ error: 'Check the quantity and print details, then try again.' }, { status: 400 });
    }
    if (sizeUnit !== 'mm' && sizeUnit !== 'cm') {
      return Response.json({ error: 'Choose mm or cm for the size unit.' }, { status: 400 });
    }
    if (!(model instanceof File) || model.size === 0 || model.size > maxFileSize) {
      return Response.json({ error: 'Attach a model file up to 10 MB.' }, { status: 400 });
    }
    const extension = model.name.split('.').pop()?.toLowerCase() ?? '';
    if (!allowedExtensions.has(extension)) {
      return Response.json({ error: 'Use an STL, OBJ, 3MF, STEP, or ZIP file.' }, { status: 400 });
    }
    if (!process.env.RESEND_API_KEY) {
      return Response.json({ error: 'Quote requests are temporarily unavailable. Please email 40230@pm.me.' }, { status: 503 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const fileBytes = Buffer.from(await model.arrayBuffer());
    const result = await resend.emails.send({
      from: process.env.PRINT_QUOTE_FROM || '4V4 Print Quotes <onboarding@resend.dev>',
      to: process.env.PRINT_QUOTE_EMAIL || '40230@pm.me',
      replyTo: email,
      subject: `Print quote request from ${name}`,
      html: `<h2>New print quote request</h2><p><b>Name:</b> ${safe(name)}</p><p><b>Email:</b> ${safe(email)}</p><p><b>Quantity:</b> ${safe(quantity)}</p><p><b>Approximate size:</b> ${safe(size || 'Not specified')} ${safe(sizeUnit)}</p><p><b>Print and delivery details:</b><br>${safe(details).replace(/\n/g, '<br>')}</p><p><b>Model:</b> ${safe(model.name)}</p>`,
      attachments: [{ filename: model.name.replace(/[^\w.()-]/g, '_'), content: fileBytes.toString('base64') }],
    });
    if (result.error) throw new Error(result.error.message);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Print quote request failed:', error);
    return Response.json({ error: 'Could not send your request. Please try again or email 40230@pm.me.' }, { status: 500 });
  }
}

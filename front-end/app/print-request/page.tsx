'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useI18n } from '@/lib/i18n';

export default function PrintRequestPage() {
  const { t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!file) {
      setStatus(t('Choose a 3D model file to include with your request.'));
      return;
    }
    setBusy(true);
    setStatus(t('Sending your request…'));
    const data = new FormData(form);
    data.set('model', file);
    try {
      const response = await fetch('/api/print-quote', { method: 'POST', body: data });
      const result = await response.json();
      if (!response.ok) throw new Error(t(result.error || 'Could not send your request.'));
      form.reset();
      setFile(null);
      setStatus(t('Request received. We’ll review the model and email you a print and delivery quote.'));
    } catch (error) {
      setStatus(error instanceof Error ? t(error.message) : t('Could not send your request. Please try again.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 pb-20 pt-32 text-foreground">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="pt-4">
          <div className="relative mb-6 w-24">
            <Image src="/wirecube-v2.png" alt={t('Wireframe cube illustration')} width={1254} height={1254} priority className="h-auto w-full object-contain" />
          </div>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">{t('← Back to 4V4')}</Link>
          <p className="mt-12 text-sm uppercase tracking-[0.2em] text-muted-foreground">{t('Print on demand')}</p>
          <h1 className="title mt-4 text-4xl font-bold leading-tight md:text-5xl">{t('Send your model.')}<br />{t('We’ll print and ship it.')}</h1>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">{t('Upload your 3D file and tell us what you need. We’ll check printability, confirm material and finish options, then email you a price for the print and delivery.')}</p>
          <div className="mt-10 space-y-5 border-t border-border pt-6 text-sm text-muted-foreground">
            <p><span className="mr-3 text-foreground">01</span> {t('Share your model and print details')}</p>
            <p><span className="mr-3 text-foreground">02</span> {t('Get a quote by email before you pay')}</p>
            <p><span className="mr-3 text-foreground">03</span> {t('Approve the quote and receive your print')}</p>
          </div>
        </section>

        <form onSubmit={submit} className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-9">
          <div>
            <h2 className="title text-2xl font-bold">{t('Request a quote')}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t('No payment is taken with this request.')}</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="name">{t('Name')}</Label><Input id="name" name="name" required maxLength={100} autoComplete="name" /></div>
            <div className="space-y-2"><Label htmlFor="email">{t('Email')}</Label><Input id="email" name="email" type="email" required maxLength={254} autoComplete="email" /></div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">{t('3D model file')}</Label>
            <Input id="model" type="file" accept=".stl,.obj,.3mf,.step,.stp,.zip" required onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
            <p className="text-xs text-muted-foreground">{t('STL, OBJ, 3MF, STEP, or ZIP · up to 10 MB')}</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="quantity">{t('Quantity')}</Label><Input id="quantity" name="quantity" type="number" min="1" max="1000" defaultValue="1" required /></div>
            <div className="space-y-2">
              <Label htmlFor="size">{t('Approximate size')}</Label>
              <div className="flex gap-2">
                <Input id="size" name="size" placeholder={t('e.g. 120 × 80 × 40')} maxLength={100} />
                <Select name="sizeUnit" required defaultValue="mm">
                  <SelectTrigger id="sizeUnit" aria-label={t('Size unit')} className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mm">mm</SelectItem>
                    <SelectItem value="cm">cm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="details">{t('Material, color, finish, and delivery location')}</Label>
            <Textarea id="details" name="details" required maxLength={2000} rows={5} placeholder={t('Tell us what you have in mind, including your city and country for delivery pricing.')} />
          </div>
          <Button type="submit" size="lg" disabled={busy} className="w-full cursor-pointer">{busy ? t('Sending…') : t('Send quote request')}</Button>
          <p aria-live="polite" role="status" className="text-sm text-muted-foreground">{status}</p>
        </form>
      </div>
    </main>
  );
}

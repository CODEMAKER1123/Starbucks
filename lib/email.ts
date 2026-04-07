import fs from 'fs';
import path from 'path';
import { Resend } from 'resend';

const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@example.local';
const EMAIL_SENDER_NAME = process.env.EMAIL_SENDER_NAME || 'Rolling Suds';
const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || '';
const EMAIL_CC = process.env.EMAIL_CC || '';
const EMAIL_DELIVERY_MODE = (process.env.EMAIL_DELIVERY_MODE || '').toLowerCase();

interface Attachment {
  name: string;
  contentType: string;
  base64: string;
}

interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  attachments: Attachment[];
}

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function getEmailMode(): 'live' | 'mock' {
  if (EMAIL_DELIVERY_MODE === 'live') return 'live';
  if (EMAIL_DELIVERY_MODE === 'mock') return 'mock';
  return process.env.RESEND_API_KEY ? 'live' : 'mock';
}

function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  return dataDir;
}

function persistMockEmail(options: EmailOptions) {
  const dataDir = ensureDataDir();
  const outboxDir = path.join(dataDir, 'mock-emails');
  if (!fs.existsSync(outboxDir)) fs.mkdirSync(outboxDir, { recursive: true });

  const payload = {
    mode: 'mock',
    from: `${EMAIL_SENDER_NAME} <${EMAIL_FROM}>`,
    replyTo: EMAIL_REPLY_TO || null,
    cc: EMAIL_CC ? [EMAIL_CC] : [],
    to: options.to,
    subject: options.subject,
    html: options.body,
    attachments: options.attachments.map((att) => ({
      filename: att.name,
      contentType: att.contentType,
      bytes: Buffer.from(att.base64, 'base64').length,
    })),
    createdAt: new Date().toISOString(),
  };

  const filename = `${Date.now()}-${slugify(options.subject)}.json`;
  fs.writeFileSync(path.join(outboxDir, filename), JSON.stringify(payload, null, 2));
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'email';
}

/**
 * Send an email via Resend, or save a mock email locally when credentials are unavailable.
 */
export async function sendEmail(options: EmailOptions): Promise<{ mode: 'live' | 'mock' }> {
  const mode = getEmailMode();

  if (mode === 'mock') {
    persistMockEmail(options);
    return { mode };
  }

  const resend = getResend();
  if (!resend) {
    throw new Error('Email delivery mode is live, but RESEND_API_KEY is missing.');
  }

  const { error } = await resend.emails.send({
    from: `${EMAIL_SENDER_NAME} <${EMAIL_FROM}>`,
    replyTo: EMAIL_REPLY_TO || undefined,
    to: [options.to],
    cc: EMAIL_CC ? [EMAIL_CC] : undefined,
    subject: options.subject,
    html: options.body,
    attachments: options.attachments.map((att) => ({
      filename: att.name,
      content: Buffer.from(att.base64, 'base64'),
    })),
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }

  return { mode };
}

export function isEmailConfigured(): boolean {
  return getEmailMode() === 'mock' || !!process.env.RESEND_API_KEY;
}

export function getEmailStatus() {
  return {
    configured: isEmailConfigured(),
    mode: getEmailMode(),
    from: EMAIL_FROM,
    senderName: EMAIL_SENDER_NAME,
    replyTo: EMAIL_REPLY_TO || null,
    cc: EMAIL_CC || null,
  };
}

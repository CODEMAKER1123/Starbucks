import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { sendEmail, getEmailStatus } from '@/lib/email';
import { downloadPhotoAsBase64 } from '@/lib/companycam';
import { generateInvoicePDF } from '@/lib/pdf/invoice';
import { generateWorkOrderPDF } from '@/lib/pdf/work-order';
import { getJobById, updateJob } from '@/lib/db';
import { EmailLog } from '@/lib/types';

interface SendRequest {
  type: 'documents' | 'photos';
  test?: boolean;
  jobId?: string;
  storeNumber: string;
  woNumber: string;
  invoiceData?: {
    invoiceNumber: string;
    price: number;
    serviceDate: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  workOrderData?: {
    address: string;
    city: string;
    state: string;
    zip: string;
    storePhone: string;
    serviceDate: string;
    technician: string;
    startTime: string;
    stopTime: string;
  };
  photoUrls?: string[];
}

async function logEmailToJob(jobId: string | undefined, log: EmailLog) {
  if (!jobId) return;
  try {
    const job = await getJobById(jobId);
    if (!job) return;
    const logs = job.emailLogs || [];
    logs.push(log);
    await updateJob(jobId, { emailLogs: logs } as Record<string, unknown>);
  } catch (err) {
    console.error('Failed to log email:', err);
  }
}

async function compressPhoto(photoUrl: string, index: number, storeNumber: string): Promise<{ name: string; contentType: string; base64: string }> {
  const { base64, contentType } = await downloadPhotoAsBase64(photoUrl);
  const inputBuffer = Buffer.from(base64, 'base64');

  if (contentType.includes('svg')) {
    return {
      name: `SB${storeNumber}_photo_${index + 1}.svg`,
      contentType,
      base64,
    };
  }

  const outputBuffer = await sharp(inputBuffer)
    .rotate()
    .resize({ width: 1600, withoutEnlargement: true })
    .jpeg({ quality: 78, mozjpeg: true })
    .toBuffer();

  return {
    name: `SB${storeNumber}_photo_${index + 1}.jpg`,
    contentType: 'image/jpeg',
    base64: outputBuffer.toString('base64'),
  };
}

export async function POST(req: NextRequest) {
  try {
    const emailStatus = getEmailStatus();
    if (!emailStatus.configured) {
      return NextResponse.json(
        { success: false, error: 'Email is unavailable. Set RESEND_API_KEY or EMAIL_DELIVERY_MODE=mock in .env.local.' },
        { status: 500 }
      );
    }

    const body: SendRequest = await req.json();
    const testRecipient = 'matt.rathbun@rollingsuds.com';

    if (body.type === 'documents') {
      if (!body.invoiceData || !body.workOrderData) {
        return NextResponse.json({ error: 'invoiceData and workOrderData required' }, { status: 400 });
      }

      const to = body.test ? testRecipient : 'documents@gosuperclean.com';
      const cc = body.test ? undefined : 'matt.rathbun@rollingsuds.com';
      const subject = `${body.test ? '[TEST] ' : ''}Starbucks #${body.storeNumber} WO# ${body.woNumber} Invoice`;

      const invPdf = generateInvoicePDF({
        storeNumber: body.storeNumber,
        woNumber: body.woNumber,
        ...body.invoiceData,
      });
      const invBase64 = Buffer.from(invPdf.output('arraybuffer')).toString('base64');

      const woPdf = generateWorkOrderPDF({
        storeNumber: body.storeNumber,
        woNumber: body.woNumber,
        ...body.workOrderData,
      });
      const woBase64 = Buffer.from(woPdf.output('arraybuffer')).toString('base64');

      const result = await sendEmail({
        to,
        subject,
        body: `<p>Attached is the invoice and signed WO for Starbucks #${body.storeNumber} WO# ${body.woNumber}. Let me know if you have any questions. Thanks.</p>`,
        cc,
        attachments: [
          {
            name: `Invoice_SB${body.storeNumber}_WO${body.woNumber}.pdf`,
            contentType: 'application/pdf',
            base64: invBase64,
          },
          {
            name: `WorkOrder_SB${body.storeNumber}_WO${body.woNumber}.pdf`,
            contentType: 'application/pdf',
            base64: woBase64,
          },
        ],
      });

      await logEmailToJob(body.jobId, {
        type: 'documents',
        to,
        subject,
        sentAt: new Date().toISOString(),
        test: !!body.test,
      });

      return NextResponse.json({
        success: true,
        mode: result.mode,
        message: result.mode === 'mock'
          ? 'Documents email captured locally in data/mock-emails'
          : 'Documents email sent',
      });
    }

    if (body.type === 'photos') {
      if (!body.photoUrls || body.photoUrls.length === 0) {
        return NextResponse.json({ error: 'photoUrls required' }, { status: 400 });
      }

      const to = body.test ? testRecipient : 'starbucks@gosuperclean.com';
      const cc = body.test ? undefined : 'matt.rathbun@rollingsuds.com';
      const subject = `${body.test ? '[TEST] ' : ''}Starbucks #${body.storeNumber} WO# ${body.woNumber} Pictures`;

      const attachments = [];
      for (let i = 0; i < body.photoUrls.length; i++) {
        attachments.push(await compressPhoto(body.photoUrls[i], i, body.storeNumber));
      }

      const result = await sendEmail({
        to,
        subject,
        body: `<p>Attached are the before/after pictures and front door photo for Starbucks #${body.storeNumber} WO# ${body.woNumber}. Let me know if you have any questions. Thanks.</p>`,
        cc,
        attachments,
      });

      await logEmailToJob(body.jobId, {
        type: 'photos',
        to,
        subject,
        sentAt: new Date().toISOString(),
        test: !!body.test,
      });

      return NextResponse.json({
        success: true,
        mode: result.mode,
        message: result.mode === 'mock'
          ? 'Photos email captured locally in data/mock-emails'
          : 'Photos email sent',
      });
    }

    return NextResponse.json({ error: 'type must be "documents" or "photos"' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(getEmailStatus());
}

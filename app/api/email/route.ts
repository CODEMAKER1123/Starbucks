import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, isEmailConfigured } from '@/lib/email';
import { downloadPhotoAsBase64 } from '@/lib/companycam';
import { generateInvoicePDF } from '@/lib/pdf/invoice';
import { generateWorkOrderPDF } from '@/lib/pdf/work-order';

interface SendRequest {
  type: 'documents' | 'photos';
  storeNumber: string;
  woNumber: string;
  // For documents email
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
  // For photos email
  photoUrls?: string[];
}

export async function POST(req: NextRequest) {
  try {
    if (!isEmailConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Azure AD credentials not configured. Set AZURE_TENANT_ID, AZURE_CLIENT_ID, and AZURE_CLIENT_SECRET in .env.local' },
        { status: 500 }
      );
    }

    const body: SendRequest = await req.json();

    if (body.type === 'documents') {
      // Generate PDFs and send to documents@gosuperclean.com
      if (!body.invoiceData || !body.workOrderData) {
        return NextResponse.json({ error: 'invoiceData and workOrderData required' }, { status: 400 });
      }

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

      await sendEmail({
        to: 'documents@gosuperclean.com',
        subject: `Starbucks #${body.storeNumber} - WO ${body.woNumber} - Invoice & Work Order`,
        body: `
          <p>Please find attached the Invoice and signed Work Order for:</p>
          <p><strong>Starbucks #${body.storeNumber}</strong><br>
          WO: ${body.woNumber}<br>
          Service Date: ${body.invoiceData.serviceDate}<br>
          ${body.invoiceData.address}, ${body.invoiceData.city}, ${body.invoiceData.state} ${body.invoiceData.zip}</p>
          <p>Thank you,<br>Rolling Suds of Westchester-Stamford<br>(914) 588-4140</p>
        `,
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

      return NextResponse.json({ success: true, message: 'Documents email sent' });

    } else if (body.type === 'photos') {
      // Download photos and send to starbucks@gosuperclean.com
      if (!body.photoUrls || body.photoUrls.length === 0) {
        return NextResponse.json({ error: 'photoUrls required' }, { status: 400 });
      }

      const attachments = [];
      for (let i = 0; i < body.photoUrls.length; i++) {
        const { base64, contentType } = await downloadPhotoAsBase64(body.photoUrls[i]);
        const ext = contentType.includes('png') ? 'png' : 'jpg';
        attachments.push({
          name: `SB${body.storeNumber}_photo_${i + 1}.${ext}`,
          contentType,
          base64,
        });
      }

      await sendEmail({
        to: 'starbucks@gosuperclean.com',
        subject: `Starbucks #${body.storeNumber} - WO ${body.woNumber} - Service Photos`,
        body: `
          <p>Please find attached the service photos for:</p>
          <p><strong>Starbucks #${body.storeNumber}</strong><br>
          WO: ${body.woNumber}</p>
          <p>${attachments.length} photos attached (front door, before/after).</p>
          <p>Thank you,<br>Rolling Suds of Westchester-Stamford<br>(914) 588-4140</p>
        `,
        attachments,
      });

      return NextResponse.json({ success: true, message: 'Photos email sent' });

    } else {
      return NextResponse.json({ error: 'type must be "documents" or "photos"' }, { status: 400 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * GET /api/email — check if email is configured
 */
export async function GET() {
  return NextResponse.json({ configured: isEmailConfigured() });
}

import { jsPDF } from 'jspdf';
import { COMPANY, SERVICE_DESCRIPTION, SERVICE_TITLE } from '../constants';

interface InvoiceData {
  storeNumber: string;
  woNumber: string;
  invoiceNumber: string;
  price: number;
  serviceDate: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

export function generateInvoicePDF(data: InvoiceData): jsPDF {
  const doc = new jsPDF('p', 'pt', 'letter');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const teal = '#00A4C7';
  const gray = '#666666';
  const darkGray = '#333333';
  let y = 40;

  // Header - Rolling Suds brand
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(teal);
  doc.text('Rolling Suds', margin, y);
  y += 14;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(gray);
  doc.text('THE POWER WASHING PROFESSIONALS', margin, y);
  y += 14;

  doc.setFontSize(9);
  doc.setTextColor(darkGray);
  doc.text(COMPANY.name, margin, y);
  y += 12;
  doc.text(COMPANY.phone, margin, y);
  y += 12;
  doc.text(COMPANY.email, margin, y);

  // INVOICE title right-aligned
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(darkGray);
  doc.text('INVOICE', pageWidth - margin, 40, { align: 'right' });

  // Meta fields right-aligned
  const metaX = pageWidth - margin;
  let metaY = 65;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(gray);

  const formattedDate = formatDate(data.serviceDate);

  const metaFields = [
    ['Invoice #', data.invoiceNumber],
    ['Date', formattedDate],
    ['Job Type', 'Commercial'],
    ['Due On', formattedDate],
  ];

  for (const [label, value] of metaFields) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, metaX - 100, metaY, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(value, metaX, metaY, { align: 'right' });
    metaY += 14;
  }

  y = 130;

  // Divider
  doc.setDrawColor(teal);
  doc.setLineWidth(1.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 20;

  // Bill To / Service Location
  const colWidth = (pageWidth - margin * 2) / 2;
  const billToLabel = 'Bill To';
  const serviceLoc = 'Service Location';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(teal);
  doc.text(billToLabel, margin, y);
  doc.text(serviceLoc, margin + colWidth, y);
  y += 16;

  const locationLines = [
    `Starbucks #${data.storeNumber} - WO ${data.woNumber}`,
    'Go Super Clean',
    data.address,
    `${data.city}, ${data.state} ${data.zip}`,
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(darkGray);

  for (const line of locationLines) {
    doc.text(line, margin, y);
    doc.text(line, margin + colWidth, y);
    y += 13;
  }

  y += 15;

  // Description Table Header
  const tableLeft = margin;
  const tableRight = pageWidth - margin;
  const tableWidth = tableRight - tableLeft;

  doc.setFillColor(teal);
  doc.rect(tableLeft, y, tableWidth, 22, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor('#FFFFFF');

  const colDesc = tableLeft + 8;
  const colQty = tableLeft + tableWidth * 0.6;
  const colPrice = tableLeft + tableWidth * 0.73;
  const colAmount = tableLeft + tableWidth * 0.87;

  doc.text('Description', colDesc, y + 15);
  doc.text('QTY', colQty, y + 15);
  doc.text('Price', colPrice, y + 15);
  doc.text('Amount', colAmount, y + 15);
  y += 22;

  // Description body
  doc.setFillColor('#f5f5f5');
  const descLines = SERVICE_DESCRIPTION.split('\n');
  const bodyHeight = 18 + descLines.length * 11 + 10;
  doc.rect(tableLeft, y, tableWidth, bodyHeight, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(darkGray);
  doc.text(SERVICE_TITLE, colDesc, y + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  let descY = y + 28;
  for (const line of descLines) {
    doc.text(line.trim(), colDesc, descY);
    descY += 11;
  }

  // QTY, Price, Amount
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('1', colQty, y + 14);
  doc.text(`$${data.price.toFixed(2)}`, colPrice, y + 14);
  doc.text(`$${data.price.toFixed(2)}`, colAmount, y + 14);

  y += bodyHeight + 5;

  // Totals
  const totalsX = colPrice;
  const totalsValX = colAmount;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(gray);
  doc.text('Sub total', totalsX, y + 14);
  doc.text(`$${data.price.toFixed(2)}`, totalsValX, y + 14);
  y += 18;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkGray);
  doc.text('Total', totalsX, y + 14);
  doc.text(`$${data.price.toFixed(2)}`, totalsValX, y + 14);
  y += 18;

  doc.setTextColor(teal);
  doc.setFontSize(10);
  doc.text('Balance Due', totalsX, y + 14);
  doc.text(`$${data.price.toFixed(2)}`, totalsValX, y + 14);
  y += 30;

  // Payment history
  doc.setDrawColor('#dddddd');
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 15;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(darkGray);
  doc.text('Payment History', margin, y);
  y += 14;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(gray);
  doc.text(`${formattedDate}    Check    $${data.price.toFixed(2)}`, margin, y);
  y += 30;

  // Terms
  doc.setFontSize(7);
  doc.setTextColor('#999999');
  doc.text('Payment is due upon receipt. Late payments may be subject to additional fees.', margin, y);
  y += 10;
  doc.text('Thank you for your business!', margin, y);

  // Bottom teal bar
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFillColor(teal);
  doc.rect(0, pageHeight - 8, pageWidth, 8, 'F');

  return doc;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

import { jsPDF } from 'jspdf';
import { SIG_SEGS, SIG_NW, SIG_NH } from '../signature';

interface WorkOrderData {
  storeNumber: string;
  woNumber: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  storePhone: string;
  serviceDate: string;
  technician: string;
  startTime: string;
  stopTime: string;
}

export function generateWorkOrderPDF(data: WorkOrderData): jsPDF {
  const doc = new jsPDF('p', 'pt', 'letter');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const darkGray = '#333333';
  const gray = '#666666';
  let y = 40;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(darkGray);
  doc.text('SUPERCLEAN SERVICE COMPANY, INC', margin, y);
  y += 14;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(gray);
  doc.text('Super Service, Super Reliable, Super Clean', margin, y);
  y += 14;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('PO Box 551802, Dallas, TX 75355', margin, y);
  y += 11;
  doc.text('P: 888-337-8737    Fax: 972-926-9733', margin, y);

  // WO # right-aligned
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(darkGray);
  doc.text(`WO # ${data.woNumber}`, pageWidth - margin, 40, { align: 'right' });

  y += 25;

  // Divider
  doc.setDrawColor('#000000');
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 18;

  // SERVICE line
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(darkGray);
  doc.text('SERVICE: Pressure Wash Patio/Sidewalk/Drive Thru', margin, y);
  y += 20;

  // Store info left, meta right
  const rightCol = pageWidth / 2 + 20;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  const storeLines = [
    `Starbucks # ${data.storeNumber}`,
    data.address,
    `${data.city}, ${data.state} ${data.zip}`,
    data.storePhone ? `Phone: ${data.storePhone}` : '',
  ].filter(Boolean);

  let storeY = y;
  for (const line of storeLines) {
    doc.text(line, margin, storeY);
    storeY += 13;
  }

  // Right side meta
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  let metaY = y;

  doc.text('SERVICE DATE:', rightCol, metaY);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(data.serviceDate), rightCol + 90, metaY);
  metaY += 14;

  doc.setFont('helvetica', 'bold');
  doc.text('AUTHORIZED STARBUCKS', rightCol, metaY);
  metaY += 12;
  doc.text('WORKTASK#:', rightCol, metaY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.woNumber, rightCol + 75, metaY);
  metaY += 14;

  doc.setFont('helvetica', 'bold');
  doc.text('IVR INSTRUCTIONS:', rightCol, metaY);
  doc.setFont('helvetica', 'normal');
  doc.text('No IVR needed', rightCol + 110, metaY);

  y = Math.max(storeY, metaY) + 20;

  // Instructions box
  doc.setFillColor('#f0f0f0');
  const instructBoxHeight = 140;
  doc.rect(margin, y, pageWidth - margin * 2, instructBoxHeight, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(darkGray);
  doc.text('Pressure Wash Patio/Sidewalk/Drive Thru   COMPLETE__________', margin + 10, y + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const instructions = [
    'Service to be performed after business hours and completed before 5am.',
    'Technician must wear proper PPE at all times on-site.',
    'Use only GREEN SEALED chemicals approved for commercial use.',
    'Take BEFORE photos upon arrival before any work begins.',
    'Pre-treat all stains with approved degreaser.',
    'Power wash all sidewalks, patio areas, and drive-thru lane.',
    'Move and replace all outdoor furniture (tables, chairs).',
    'Drive thru: up to 10ft past and 30ft before pick up window.',
    'Sweep and remove all dirt and debris before pressure washing.',
    'Clean any overspray from windows and glass surfaces.',
    'Take AFTER photos when work is complete.',
    'Email all photos to Starbucks@gosuperclean.com',
  ];

  let instrY = y + 32;
  for (const line of instructions) {
    doc.text(`• ${line}`, margin + 10, instrY);
    instrY += 10;
  }

  y += instructBoxHeight + 15;

  // Photo warning - red text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor('#CC0000');
  doc.text('IMPORTANT! 5 PHOTOS REQUIRED FOR PAYMENT!', margin, y);
  y += 14;
  doc.setFontSize(8);
  doc.text('TWO AREAS WITH BEFORE/AFTER + 1 PHOTO OF FRONT DOOR WITH ADDRESS', margin, y);
  y += 22;

  // Checklist and Completion side by side
  const checklistX = margin;
  const completionX = pageWidth / 2 + 30;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(darkGray);
  doc.text('Technician Completion Checklist:', checklistX, y);
  doc.text('Completion:', completionX, y);
  y += 16;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  const checklist = [
    'Respectful conduct',
    'Bring WO and Photo ID',
    'Pre treat stains (Green chemicals)',
    'Remove/replace furniture',
    'Power wash all areas',
    'Before/after photos (5 min)',
    'Dispose wastewater',
    'Wipe windows',
    'Photos to Starbucks@gosuperclean.com',
  ];

  let checkY = y;
  for (const item of checklist) {
    doc.text(`[X] ${item}`, checklistX, checkY);
    checkY += 12;
  }

  // Completion section
  let compY = y;
  const labelX = completionX;
  const valX = completionX + 100;

  doc.setFont('helvetica', 'bold');
  doc.text('Date Completed:', labelX, compY);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(data.serviceDate), valX, compY);
  compY += 14;

  doc.setFont('helvetica', 'bold');
  doc.text('Technician:', labelX, compY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.technician || 'Rolling Suds of Westchester-Stamford', valX, compY);
  compY += 14;

  doc.setFont('helvetica', 'bold');
  doc.text('Start Time:', labelX, compY);
  doc.setFont('helvetica', 'normal');
  doc.text(formatTime(data.startTime), valX, compY);
  compY += 14;

  doc.setFont('helvetica', 'bold');
  doc.text('Stop Time:', labelX, compY);
  doc.setFont('helvetica', 'normal');
  doc.text(formatTime(data.stopTime), valX, compY);
  compY += 14;

  doc.setFont('helvetica', 'bold');
  doc.text('Total Hours:', labelX, compY);
  doc.setFont('helvetica', 'normal');
  doc.text(calculateHours(data.startTime, data.stopTime), valX, compY);
  compY += 25;

  y = Math.max(checkY, compY) + 10;

  // Signature
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Tech Signature:', completionX, y);
  y += 8;

  // Draw signature using vector segments
  const sigWidth = 160;
  const sigHeight = (SIG_NH / SIG_NW) * sigWidth;
  const sigX = completionX;
  const sigY = y;
  const scaleX = sigWidth / SIG_NW;
  const scaleY = sigHeight / SIG_NH;

  doc.setFillColor('#1a1a2e');
  for (const [sx, sy, sw] of SIG_SEGS) {
    doc.rect(
      sigX + sx * scaleX,
      sigY + sy * scaleY,
      sw * scaleX,
      scaleY,
      'F'
    );
  }

  y += sigHeight + 10;

  // Signature line
  doc.setDrawColor('#000000');
  doc.setLineWidth(0.5);
  doc.line(completionX, y, completionX + sigWidth, y);

  y += 25;

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(gray);
  doc.text('Fax this signed work order to Superclean no more than 24 hours after service completion.', margin, y);
  y += 10;
  doc.text('Work orders received more than 30 days after service will not be considered valid.', margin, y);

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

function formatTime(time: string): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function calculateHours(start: string, stop: string): string {
  if (!start || !stop) return '';
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = stop.split(':').map(Number);
  let startMin = sh * 60 + sm;
  let endMin = eh * 60 + em;
  if (endMin < startMin) endMin += 24 * 60; // overnight
  const diff = endMin - startMin;
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  return `${hours}h ${mins}m`;
}

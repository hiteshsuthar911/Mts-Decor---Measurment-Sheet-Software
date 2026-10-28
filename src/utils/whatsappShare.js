/**
 * Quick WhatsApp Dispatch Utility for Civil & Interior Contractors
 * Formats clean, professional WhatsApp messages for clients, architects, and site engineers.
 */

export function sanitizePhoneNumber(phone = '') {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`; // Standard Indian 10-digit mobile
  }
  return digits;
}

export function formatCurrencyINR(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0.00';
  const num = Number(amount);
  return '₹' + num.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  });
}

/**
 * Generates an executive WhatsApp message for a measurement sheet / bill
 */
export function buildWhatsAppBillMessage({
  projectName = 'PROJECT',
  folderName = '',
  clientName = '',
  location = '',
  billNumber = '',
  totalAmount = 0,
  formattedAmount = '',
  publicPdfUrl = '',
  verificationPin = '',
  senderName = 'MTS Decor Billing Team',
  customNote = ''
}) {
  const amountStr = formattedAmount || formatCurrencyINR(totalAmount);
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const lines = [
    `*📋 MTS DECOR — MEASUREMENT & BILL DISPATCH*`,
    `────────────────────────`,
    folderName ? `📁 *Project / Site:* ${folderName}` : null,
    `📑 *Bill / Sheet:* ${projectName}`,
    clientName ? `👤 *Client:* ${clientName}` : null,
    location ? `📍 *Location:* ${location}` : null,
    billNumber ? `🔖 *Bill Ref:* ${billNumber}` : null,
    `📅 *Date:* ${dateStr}`,
    `────────────────────────`,
    `💰 *Total Amount:* *${amountStr}*`,
    `────────────────────────`,
    customNote ? `\n📝 *Note:* ${customNote}\n` : null,
    publicPdfUrl ? `\n📲 *View & Download Official Sheet / PDF:*\n${publicPdfUrl}` : null,
    verificationPin ? `🔑 *Access PIN:* ${verificationPin}` : null,
    `\n_Sent via ${senderName}_`
  ].filter(line => line !== null);

  return lines.join('\n');
}

/**
 * Triggers WhatsApp share via browser or native WhatsApp client
 */
export function shareViaWhatsApp({
  phone = '',
  message = '',
  projectName = '',
  folderName = '',
  clientName = '',
  location = '',
  billNumber = '',
  totalAmount = 0,
  formattedAmount = '',
  publicPdfUrl = '',
  verificationPin = '',
  senderName = '',
  customNote = ''
}) {
  const bodyText = message || buildWhatsAppBillMessage({
    projectName,
    folderName,
    clientName,
    location,
    billNumber,
    totalAmount,
    formattedAmount,
    publicPdfUrl,
    verificationPin,
    senderName,
    customNote
  });

  const cleanPhone = sanitizePhoneNumber(phone);
  const encodedText = encodeURIComponent(bodyText);
  const targetUrl = cleanPhone 
    ? `https://wa.me/${cleanPhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;

  if (typeof window !== 'undefined') {
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  }
  return targetUrl;
}

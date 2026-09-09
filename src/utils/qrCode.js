import QRCode from 'qrcode';

/**
 * Generate a QR code as a Data URL (image/png) for embedding in print sheets
 * @param {Object} projectData - The project measurement data
 * @param {number} pageNumber - Current sheet page number
 * @returns {Promise<string>} Data URL containing QR code PNG
 */
export async function generateVerificationQRCode(projectData, pageNumber = 1) {
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mtsdecor.com';
    const projectId = projectData?.id || 'doc-mts';
    const title = encodeURIComponent(projectData?.projectTitle || 'Measurement Sheet');
    const date = projectData?.date || new Date().toISOString().split('T')[0];
    
    // Verification URL that can be opened on any phone camera
    const verifyUrl = `${origin}/#verify?id=${projectId}&title=${title}&dt=${date}&p=${pageNumber}`;
    
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 140,
      color: {
        dark: '#111827',
        light: '#ffffff'
      }
    });

    return qrDataUrl;
  } catch (err) {
    console.error('Failed to generate verification QR code:', err);
    return null;
  }
}

/**
 * Synchronous SVG generator fallback for QR codes
 */
export async function generateVerificationQRSvg(projectData, pageNumber = 1) {
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mtsdecor.com';
    const projectId = projectData?.id || 'doc-mts';
    const title = encodeURIComponent(projectData?.projectTitle || 'Measurement Sheet');
    const date = projectData?.date || new Date().toISOString().split('T')[0];
    const verifyUrl = `${origin}/#verify?id=${projectId}&title=${title}&dt=${date}&p=${pageNumber}`;

    return await QRCode.toString(verifyUrl, {
      type: 'svg',
      margin: 1,
      width: 120
    });
  } catch (err) {
    console.error('Failed to generate QR SVG:', err);
    return '';
  }
}

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generate multi-page PDF base64 from an array of DOM elements (e.g. .contractor-sheet-page).
 * 
 * @param {HTMLElement[]} pageElements - Array of sheet page elements
 * @param {Function} [onProgress] - Optional progress callback: (currentPage, totalPages) => void
 * @returns {Promise<{ base64: string, dataUri: string, fileSize: number, pageCount: number, blob: Blob }>}
 */
export async function generatePdfBase64FromPages(pageElements, onProgress) {
  if (!pageElements || pageElements.length === 0) {
    throw new Error('NO PAGES FOUND TO GENERATE PDF');
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pdfWidth = 210;
  const pdfHeight = 297;

  for (let i = 0; i < pageElements.length; i++) {
    if (typeof onProgress === 'function') {
      onProgress(i + 1, pageElements.length);
    }

    const pageEl = pageElements[i];

    // Capture element with html2canvas (retina 2x scale for crisp printing & reading)
    const canvas = await html2canvas(pageEl, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1200, // standard desktop width for clean consistent layout
      ignoreElements: (element) => {
        return (
          element.classList?.contains('d-print-none') ||
          element.classList?.contains('no-print')
        );
      },
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    if (i > 0) {
      pdf.addPage('a4', 'portrait');
    }

    const imgProps = pdf.getImageProperties(imgData);
    const canvasWidth = imgProps.width;
    const canvasHeight = imgProps.height;
    const ratio = canvasHeight / canvasWidth;

    let renderWidth = pdfWidth;
    let renderHeight = pdfWidth * ratio;

    if (renderHeight > pdfHeight) {
      renderHeight = pdfHeight;
      renderWidth = pdfHeight / ratio;
    }

    const marginX = (pdfWidth - renderWidth) / 2;
    const marginY = 0;

    pdf.addImage(imgData, 'JPEG', marginX, marginY, renderWidth, renderHeight);
  }

  const dataUri = pdf.output('datauristring');
  const base64 = dataUri.split(',')[1];
  const fileSize = Math.round((base64.length * 3) / 4);

  return {
    base64,
    dataUri,
    fileSize,
    pageCount: pageElements.length,
    blob: pdf.output('blob'),
  };
}

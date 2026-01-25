import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Transaction } from '../../types';

export const generateImpactReceipt = async (transaction: Transaction) => {
  // 1. Create a hidden container for the receipt
  const element = document.getElementById(`receipt-${transaction.id}`);
  if (!element) return;

  try {
    // 2. Capture the element as a high-res canvas
    const canvas = await html2canvas(element, {
      scale: 3, // High DPI for crisp text
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    
    // 3. Initialize PDF (A4 size)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    
    // 4. Set Metadata
    pdf.setProperties({
      title: `Givar_Receipt_${transaction.reference}`,
      subject: 'Donation Receipt',
      author: 'Givar Impact Platform',
    });

    // 5. Download
    pdf.save(`Givar_Receipt_${transaction.reference.slice(0, 8)}.pdf`);
  } catch (error) {
    console.error('Receipt generation failed:', error);
    throw new Error('Failed to generate PDF');
  }
};
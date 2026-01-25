import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Transaction } from '../../types';

export const generateImpactReceipt = async (transaction: Transaction) => {
  const element = document.getElementById(`receipt-${transaction.id}`);
  if (!element) return;

  try {
    const canvas = await html2canvas(element, {
      scale: 2, 
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 800, 
    });

    // Optimization: Switch from PNG to JPEG with 0.85 quality
    // This provides the most significant reduction in file size.
    const imgData = canvas.toDataURL('image/jpeg', 0.85);
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const imgWidth = 210; // A4 width
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Center the image if it doesn't fill the page height
    const yOffset = (297 - imgHeight) > 0 ? 0 : 0; 

    pdf.addImage(imgData, 'JPEG', 0, yOffset, imgWidth, imgHeight, undefined, 'FAST');
    
    pdf.setProperties({
      title: `Givar_Receipt_${transaction.reference}`,
      subject: 'Donation Receipt',
      author: 'Givar Impact Platform',
      keywords: 'impact, donation, receipt, givar',
      creator: 'Givar Systems'
    });

    pdf.save(`Givar_Receipt_${transaction.reference.slice(0, 8)}.pdf`);
  } catch (error) {
    console.error('Receipt generation failed:', error);
    throw new Error('Failed to generate optimized PDF');
  }
};
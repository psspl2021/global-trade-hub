import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DocumentItem {
  description: string;
  hsn_code?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  tax_rate?: number;
  tax_amount: number;
  total: number;
}

interface DocumentData {
  documentType: 'proforma_invoice' | 'tax_invoice' | 'debit_note' | 'credit_note';
  documentNumber: string;
  issueDate: string;
  dueDate?: string;
  referenceInvoiceNumber?: string;
  referenceInvoiceDate?: string;
  
  // Supplier details
  companyName: string;
  companyAddress: string;
  companyGstin: string;
  companyLogo?: string | null;
  
  // Buyer details
  buyerName: string;
  buyerAddress: string;
  buyerGstin: string;
  buyerEmail?: string;
  buyerPhone?: string;
  
  // Items
  items: DocumentItem[];
  
  // Totals
  subtotal: number;
  discountPercent?: number;
  discountAmount?: number;
  taxAmount: number;
  totalAmount: number;
  
  // Additional info
  notes?: string;
  terms?: string;
  bankDetails?: {
    bankName: string;
    bankAccount: string;
    bankIfsc: string;
    bankLocation?: string;
  };
  reason?: string; // For debit/credit notes
}

const getDocumentTitle = (type: string): string => {
  switch (type) {
    case 'proforma_invoice': return 'PROFORMA INVOICE';
    case 'tax_invoice': return 'TAX INVOICE';
    case 'debit_note': return 'DEBIT NOTE';
    case 'credit_note': return 'CREDIT NOTE';
    default: return 'INVOICE';
  }
};

const formatCurrency = (amount: number): string => {
  return `₹ ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Load the Procuresaathi logo
const loadLogo = async (): Promise<string | null> => {
  try {
    const response = await fetch('/procuresaathi-logo.png');
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

export const generateDocumentPDF = async (data: DocumentData): Promise<void> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPos = 15;

  // Load logo
  const logoData = await loadLogo();

  // Add logo if available - larger size
  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', margin, yPos, 50, 22);
    } catch {
      // Skip if logo fails
    }
  }

  // Header - Document Title (Large, centered, bold)
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(33, 37, 41);
  doc.text(getDocumentTitle(data.documentType), pageWidth / 2, yPos + 14, { align: 'center' });
  yPos += 30;

  // Draw a decorative line under header
  doc.setDrawColor(0, 102, 204);
  doc.setLineWidth(1.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  // Document Details (Right side) - positioned BELOW the blue line
  const rightX = pageWidth - margin;
  let rightY = yPos + 8; // Start below the blue line
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  const labelKey = data.documentType.includes('invoice') ? 'Invoice No:' : 'Note No:';
  doc.text(labelKey, rightX - 55, rightY);
  doc.setTextColor(33, 37, 41);
  doc.setFont('helvetica', 'normal');
  doc.text(data.documentNumber, rightX, rightY, { align: 'right' });
  rightY += 7;
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('Date:', rightX - 55, rightY);
  doc.setTextColor(33, 37, 41);
  doc.setFont('helvetica', 'normal');
  doc.text(data.issueDate, rightX, rightY, { align: 'right' });
  rightY += 7;
  
  // Reference Invoice with DTD format: "77/2025-26 DTD 10/10/2025"
  if (data.referenceInvoiceNumber) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text('Ref Invoice:', rightX - 55, rightY);
    doc.setTextColor(33, 37, 41);
    doc.setFont('helvetica', 'normal');
    const refText = data.referenceInvoiceDate 
      ? `${data.referenceInvoiceNumber} DTD ${data.referenceInvoiceDate}`
      : data.referenceInvoiceNumber;
    doc.text(refText, rightX, rightY, { align: 'right' });
    rightY += 7;
  }

  if (data.dueDate) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text('Due Date:', rightX - 55, rightY);
    doc.setTextColor(33, 37, 41);
    doc.setFont('helvetica', 'normal');
    doc.text(data.dueDate, rightX, rightY, { align: 'right' });
    rightY += 7;
  }
  
  yPos += 10;

  // From Section with company details (Left side)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('From:', margin, yPos);
  doc.setTextColor(33, 37, 41);
  yPos += 5;
  
  // Company Name - larger and bold
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(data.companyName || 'Procuresaathi Solutions Private Limited', margin, yPos);
  yPos += 5;

  // Company Address
  if (data.companyAddress) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const addressLines = doc.splitTextToSize(data.companyAddress, 90);
    doc.text(addressLines, margin, yPos);
    yPos += addressLines.length * 4;
  }

  // Company GSTIN
  if (data.companyGstin) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('GSTIN: ', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(data.companyGstin, margin + 15, yPos);
    yPos += 5;
  }

  yPos = Math.max(yPos + 8, rightY + 5);

  // Bill To Section
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('Bill To:', margin, yPos);
  yPos += 6;
  
  // Buyer Name - uppercase and bold
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(33, 37, 41);
  doc.text(data.buyerName.toUpperCase(), margin, yPos);
  yPos += 5;
  
  // Buyer Address
  if (data.buyerAddress) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const addressLines = doc.splitTextToSize(data.buyerAddress, pageWidth - 40);
    doc.text(addressLines, margin, yPos);
    yPos += addressLines.length * 4;
  }
  
  // Buyer GSTIN
  if (data.buyerGstin) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('GSTIN: ', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(data.buyerGstin, margin + 15, yPos);
    yPos += 5;
  }

  if (data.buyerPhone) {
    doc.setFontSize(9);
    doc.text(`Phone: ${data.buyerPhone}`, margin, yPos);
    yPos += 4;
  }

  if (data.buyerEmail) {
    doc.setFontSize(9);
    doc.text(`Email: ${data.buyerEmail}`, margin, yPos);
    yPos += 4;
  }

  // Reason Section (for debit/credit notes)
  if (data.reason) {
    yPos += 3;
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Reason:', margin, yPos);
    doc.setTextColor(33, 37, 41);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    yPos += 5;
    const reasonLines = doc.splitTextToSize(data.reason, pageWidth - 30);
    doc.text(reasonLines, margin, yPos);
    yPos += reasonLines.length * 5;
  }

  yPos += 8;

  // Items Table with professional styling
  const tableColumns = ['#', 'Description', 'HSN', 'Qty', 'Unit', 'Rate', 'Tax %', 'Tax Amt', 'Total'];

  const tableData = data.items.map((item, index) => [
    (index + 1).toString(),
    item.description,
    item.hsn_code || '-',
    item.quantity.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    item.unit,
    formatCurrency(item.unit_price),
    item.tax_rate ? `${item.tax_rate}%` : '-',
    formatCurrency(item.tax_amount),
    formatCurrency(item.total),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [tableColumns],
    body: tableData,
    theme: 'striped',
    headStyles: { 
      fillColor: [0, 102, 204], 
      textColor: 255, 
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center'
    },
    styles: { 
      fontSize: 9, 
      cellPadding: 4,
      lineColor: [220, 220, 220],
      lineWidth: 0.1,
      textColor: [33, 37, 41]
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 45 },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 15, halign: 'right' },
      4: { cellWidth: 15, halign: 'center' },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 15, halign: 'center' },
      7: { cellWidth: 22, halign: 'right' },
      8: { cellWidth: 28, halign: 'right' },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Totals Section - Right aligned with styled box - WIDER to fit numbers
  const totalsBoxWidth = 110;
  const totalsX = pageWidth - margin - totalsBoxWidth + 15;
  const totalsValueX = pageWidth - margin - 10;
  
  doc.setDrawColor(0, 102, 204);
  doc.setFillColor(255, 255, 255);
  
  let totalsHeight = 40;
  if (data.discountPercent && data.discountPercent > 0) totalsHeight += 12;
  
  doc.roundedRect(totalsX - 15, yPos - 8, totalsBoxWidth, totalsHeight, 3, 3, 'FD');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(33, 37, 41);
  
  doc.text('Subtotal:', totalsX, yPos);
  doc.text(formatCurrency(data.subtotal), totalsValueX, yPos, { align: 'right' });
  yPos += 10;

  if (data.discountPercent && data.discountPercent > 0) {
    doc.text(`Discount (${data.discountPercent}%):`, totalsX, yPos);
    doc.text(`-${formatCurrency(data.discountAmount || 0)}`, totalsValueX, yPos, { align: 'right' });
    yPos += 10;
  }

  doc.text('Tax:', totalsX, yPos);
  doc.text(formatCurrency(data.taxAmount), totalsValueX, yPos, { align: 'right' });
  yPos += 12;

  // Total line with emphasis
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(0, 102, 204);
  doc.text('Total:', totalsX, yPos);
  doc.text(formatCurrency(data.totalAmount), totalsValueX, yPos, { align: 'right' });
  doc.setTextColor(33, 37, 41);
  yPos += 20;

  // Bank Details Section (for invoices)
  if (data.bankDetails && data.bankDetails.bankName) {
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Bank Details:', margin, yPos);
    doc.setTextColor(33, 37, 41);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    yPos += 6;
    
    doc.text(`Bank: ${data.bankDetails.bankName}`, margin, yPos);
    yPos += 5;
    doc.text(`A/C No: ${data.bankDetails.bankAccount}`, margin, yPos);
    yPos += 5;
    doc.text(`IFSC: ${data.bankDetails.bankIfsc}`, margin, yPos);
    if (data.bankDetails.bankLocation) {
      yPos += 5;
      doc.text(`Branch: ${data.bankDetails.bankLocation}`, margin, yPos);
    }
    yPos += 10;
  }

  // Notes Section
  if (data.notes) {
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Notes:', margin, yPos);
    doc.setTextColor(33, 37, 41);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    yPos += 6;
    const notesLines = doc.splitTextToSize(data.notes, pageWidth - 30);
    doc.text(notesLines, margin, yPos);
    yPos += notesLines.length * 5 + 5;
  }

  // Terms & Conditions Section
  if (data.terms) {
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Terms & Conditions:', margin, yPos);
    doc.setTextColor(33, 37, 41);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    yPos += 6;
    const termsLines = doc.splitTextToSize(data.terms, pageWidth - 30);
    doc.text(termsLines, margin, yPos);
  }

  // Save PDF with formatted filename
  const fileName = `${getDocumentTitle(data.documentType).replace(/\s+/g, '_')}_${data.documentNumber}.pdf`;
  doc.save(fileName);
};

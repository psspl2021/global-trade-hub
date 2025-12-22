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

export const generateDocumentPDF = async (data: DocumentData): Promise<void> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPos = 20;

  // Header - Document Title (Large, centered, bold)
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(getDocumentTitle(data.documentType), pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Draw a line under header
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // From Section (Left side)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('From:', margin, yPos);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  yPos += 5;
  
  if (data.companyName) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(data.companyName, margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    yPos += 6;
  }

  // Document Details (Right side) - on same line as From
  const rightX = pageWidth - margin;
  let rightY = yPos - 11; // Start at same level as "From:"
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const labelKey = data.documentType.includes('invoice') ? 'Invoice No:' : 'Note No:';
  doc.text(labelKey, rightX - 50, rightY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.documentNumber, rightX, rightY, { align: 'right' });
  rightY += 6;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', rightX - 50, rightY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.issueDate, rightX, rightY, { align: 'right' });
  rightY += 6;
  
  if (data.referenceInvoiceNumber) {
    doc.setFont('helvetica', 'bold');
    doc.text('Ref Invoice:', rightX - 50, rightY);
    doc.setFont('helvetica', 'normal');
    const refText = data.referenceInvoiceDate 
      ? `${data.referenceInvoiceNumber} (${data.referenceInvoiceDate})`
      : data.referenceInvoiceNumber;
    doc.text(refText, rightX, rightY, { align: 'right' });
    rightY += 6;
  }

  if (data.dueDate) {
    doc.setFont('helvetica', 'bold');
    doc.text('Due Date:', rightX - 50, rightY);
    doc.setFont('helvetica', 'normal');
    doc.text(data.dueDate, rightX, rightY, { align: 'right' });
  }

  yPos += 15;

  // Bill To Section
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('Bill To:', margin, yPos);
  doc.setTextColor(0, 0, 0);
  yPos += 6;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(data.buyerName.toUpperCase(), margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  yPos += 5;
  
  if (data.buyerAddress) {
    const addressLines = doc.splitTextToSize(data.buyerAddress, pageWidth - 40);
    doc.text(addressLines, margin, yPos);
    yPos += addressLines.length * 5;
  }
  
  if (data.buyerGstin) {
    doc.setFont('helvetica', 'bold');
    doc.text('GSTIN: ', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(data.buyerGstin, margin + 15, yPos);
    yPos += 5;
  }

  if (data.buyerPhone) {
    doc.text(`Phone: ${data.buyerPhone}`, margin, yPos);
    yPos += 5;
  }

  if (data.buyerEmail) {
    doc.text(`Email: ${data.buyerEmail}`, margin, yPos);
    yPos += 5;
  }

  // Reason Section (for debit/credit notes)
  if (data.reason) {
    yPos += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('Reason:', margin, yPos);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    yPos += 5;
    const reasonLines = doc.splitTextToSize(data.reason, pageWidth - 30);
    doc.text(reasonLines, margin, yPos);
    yPos += reasonLines.length * 5;
  }

  yPos += 10;

  // Items Table with professional styling
  const tableColumns = ['#', 'Description', 'HSN', 'Qty', 'Unit', 'Rate', 'Tax %', 'Tax Amt', 'Total'];

  const tableData = data.items.map((item, index) => [
    (index + 1).toString(),
    item.description,
    item.hsn_code || '-',
    item.quantity.toString(),
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
      fillColor: [51, 51, 51], 
      textColor: 255, 
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center'
    },
    styles: { 
      fontSize: 9, 
      cellPadding: 4,
      lineColor: [200, 200, 200],
      lineWidth: 0.1
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 45 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 15, halign: 'center' },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 15, halign: 'center' },
      7: { cellWidth: 22, halign: 'right' },
      8: { cellWidth: 26, halign: 'right' },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Totals Section - Right aligned with box
  const totalsBoxWidth = 80;
  const totalsX = pageWidth - margin - totalsBoxWidth;
  
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(250, 250, 250);
  
  let totalsHeight = 30;
  if (data.discountPercent && data.discountPercent > 0) totalsHeight += 8;
  
  doc.roundedRect(totalsX - 5, yPos - 5, totalsBoxWidth + 10, totalsHeight, 2, 2, 'FD');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  doc.text('Subtotal:', totalsX, yPos);
  doc.text(formatCurrency(data.subtotal), pageWidth - margin, yPos, { align: 'right' });
  yPos += 8;

  if (data.discountPercent && data.discountPercent > 0) {
    doc.text(`Discount (${data.discountPercent}%):`, totalsX, yPos);
    doc.text(`-${formatCurrency(data.discountAmount || 0)}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 8;
  }

  doc.text('Tax:', totalsX, yPos);
  doc.text(formatCurrency(data.taxAmount), pageWidth - margin, yPos, { align: 'right' });
  yPos += 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total:', totalsX, yPos);
  doc.text(formatCurrency(data.totalAmount), pageWidth - margin, yPos, { align: 'right' });
  yPos += 20;

  // Bank Details Section (for invoices)
  if (data.bankDetails && data.bankDetails.bankName) {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('Bank Details:', margin, yPos);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
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
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('Notes:', margin, yPos);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    yPos += 6;
    const notesLines = doc.splitTextToSize(data.notes, pageWidth - 30);
    doc.text(notesLines, margin, yPos);
    yPos += notesLines.length * 5 + 5;
  }

  // Terms & Conditions Section
  if (data.terms) {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('Terms & Conditions:', margin, yPos);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    yPos += 6;
    const termsLines = doc.splitTextToSize(data.terms, pageWidth - 30);
    doc.text(termsLines, margin, yPos);
  }

  // Save PDF with formatted filename
  const fileName = `${getDocumentTitle(data.documentType).replace(/\s+/g, '_')}_${data.documentNumber}.pdf`;
  doc.save(fileName);
};

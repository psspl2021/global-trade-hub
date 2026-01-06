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
  documentType: 'proforma_invoice' | 'tax_invoice' | 'debit_note' | 'credit_note' | 'purchase_order';
  documentNumber: string;
  issueDate: string;
  dueDate?: string;
  referenceInvoiceNumber?: string;
  referenceInvoiceDate?: string;
  expectedDeliveryDate?: string;
  
  companyName: string;
  companyAddress: string;
  companyGstin: string;
  companyLogo?: string | null;
  
  buyerName: string;
  buyerAddress: string;
  buyerGstin: string;
  buyerEmail?: string;
  buyerPhone?: string;
  
  items: DocumentItem[];
  
  subtotal: number;
  discountPercent?: number;
  discountAmount?: number;
  taxAmount: number;
  totalAmount: number;
  
  notes?: string;
  terms?: string;
  bankDetails?: {
    bankName: string;
    bankAccount: string;
    bankIfsc: string;
    bankLocation?: string;
  };
  reason?: string;
  deliveryAddress?: string;
}

const getDocumentTitle = (type: string): string => {
  switch (type) {
    case 'proforma_invoice': return 'PROFORMA INVOICE';
    case 'tax_invoice': return 'TAX INVOICE';
    case 'debit_note': return 'DEBIT NOTE';
    case 'credit_note': return 'CREDIT NOTE';
    case 'purchase_order': return 'PURCHASE ORDER';
    default: return 'INVOICE';
  }
};

// Format currency for display (use Rs. instead of ₹ for PDF compatibility)
const formatCurrency = (amount: number): string => {
  const formatted = Math.abs(amount).toLocaleString('en-IN', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
  return amount < 0 ? `(Rs. ${formatted})` : `Rs. ${formatted}`;
};

// Format number without currency symbol for table cells
const formatNumber = (amount: number): string => {
  return amount.toLocaleString('en-IN', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
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
  const margin = 14;
  let yPos = 12;

  // Load company logo if provided, otherwise load default logo
  let logoData: string | null = null;
  if (data.companyLogo) {
    logoData = data.companyLogo;
  } else {
    logoData = await loadLogo();
  }

  // === HEADER SECTION ===
  // Document title on the right
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 102, 153);
  doc.text(getDocumentTitle(data.documentType), pageWidth - margin, yPos + 8, { align: 'right' });
  
  // Add logo on the left if available
  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', margin, yPos, 35, 16);
    } catch {
      // Skip if logo fails
    }
  }
  
  yPos += 25;

  // Blue header line
  doc.setDrawColor(0, 102, 153);
  doc.setLineWidth(0.8);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // === COMPANY & DOCUMENT INFO SECTION ===
  const leftColWidth = 100;
  const rightColX = pageWidth - margin - 60;
  
  // Left side: Company/Supplier details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text('From:', margin, yPos);
  yPos += 5;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(33, 37, 41);
  const companyName = data.companyName || 'Procuresaathi Solutions Private Limited';
  doc.text(companyName, margin, yPos);
  yPos += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  if (data.companyAddress) {
    const addressLines = doc.splitTextToSize(data.companyAddress, leftColWidth);
    doc.text(addressLines, margin, yPos);
    yPos += addressLines.length * 4;
  }

  if (data.companyGstin) {
    doc.setFont('helvetica', 'bold');
    doc.text('GSTIN: ', margin, yPos);
    const gstinWidth = doc.getTextWidth('GSTIN: ');
    doc.setFont('helvetica', 'normal');
    doc.text(data.companyGstin, margin + gstinWidth, yPos);
    yPos += 6;
  }

  // Right side: Document details (positioned at same starting Y as company)
  let rightY = yPos - 22;
  doc.setFontSize(9);
  
  const docLabel = data.documentType === 'purchase_order' ? 'PO No:' : 
                   data.documentType.includes('invoice') ? 'Invoice No:' : 'Note No:';
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text(docLabel, rightColX, rightY);
  doc.setTextColor(33, 37, 41);
  doc.setFont('helvetica', 'normal');
  doc.text(data.documentNumber, pageWidth - margin, rightY, { align: 'right' });
  rightY += 6;
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text('Date:', rightColX, rightY);
  doc.setTextColor(33, 37, 41);
  doc.setFont('helvetica', 'normal');
  doc.text(data.issueDate, pageWidth - margin, rightY, { align: 'right' });
  rightY += 6;
  
  if (data.referenceInvoiceNumber) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('Ref Invoice:', rightColX, rightY);
    doc.setTextColor(33, 37, 41);
    doc.setFont('helvetica', 'normal');
    const refText = data.referenceInvoiceDate 
      ? `${data.referenceInvoiceNumber} dtd ${data.referenceInvoiceDate}`
      : data.referenceInvoiceNumber;
    doc.text(refText, pageWidth - margin, rightY, { align: 'right' });
    rightY += 6;
  }

  if (data.dueDate) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('Due Date:', rightColX, rightY);
    doc.setTextColor(33, 37, 41);
    doc.setFont('helvetica', 'normal');
    doc.text(data.dueDate, pageWidth - margin, rightY, { align: 'right' });
    rightY += 6;
  }

  if (data.expectedDeliveryDate) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('Delivery:', rightColX, rightY);
    doc.setTextColor(33, 37, 41);
    doc.setFont('helvetica', 'normal');
    doc.text(data.expectedDeliveryDate, pageWidth - margin, rightY, { align: 'right' });
  }

  yPos = Math.max(yPos + 5, rightY + 5);

  // === BILL TO SECTION ===
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 6;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  const toLabel = data.documentType === 'purchase_order' ? 'Vendor:' : 'Bill To:';
  doc.text(toLabel, margin, yPos);
  yPos += 5;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(33, 37, 41);
  doc.text(data.buyerName.toUpperCase(), margin, yPos);
  yPos += 5;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  if (data.buyerAddress) {
    const addressLines = doc.splitTextToSize(data.buyerAddress, pageWidth - 30);
    doc.text(addressLines, margin, yPos);
    yPos += addressLines.length * 4;
  }
  
  if (data.buyerGstin) {
    doc.setFont('helvetica', 'bold');
    doc.text('GSTIN: ', margin, yPos);
    const gstinWidth = doc.getTextWidth('GSTIN: ');
    doc.setFont('helvetica', 'normal');
    doc.text(data.buyerGstin, margin + gstinWidth, yPos);
    yPos += 5;
  }

  if (data.buyerPhone) {
    doc.text(`Phone: ${data.buyerPhone}`, margin, yPos);
    yPos += 4;
  }

  if (data.buyerEmail) {
    doc.text(`Email: ${data.buyerEmail}`, margin, yPos);
    yPos += 4;
  }

  // === DELIVERY ADDRESS (for PO) ===
  if (data.deliveryAddress) {
    yPos += 3;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 6;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text('Delivery Address:', margin, yPos);
    doc.setTextColor(33, 37, 41);
    doc.setFont('helvetica', 'normal');
    yPos += 5;
    const deliveryLines = doc.splitTextToSize(data.deliveryAddress, pageWidth - 30);
    doc.text(deliveryLines, margin, yPos);
    yPos += deliveryLines.length * 4;
  }

  // === REASON (for debit/credit notes) ===
  if (data.reason) {
    yPos += 3;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 6;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text('Reason:', margin, yPos);
    doc.setTextColor(33, 37, 41);
    doc.setFont('helvetica', 'normal');
    yPos += 5;
    const reasonLines = doc.splitTextToSize(data.reason, pageWidth - 30);
    doc.text(reasonLines, margin, yPos);
    yPos += reasonLines.length * 4;
  }

  yPos += 6;

  // === ITEMS TABLE ===
  const tableColumns = ['#', 'Description', 'HSN', 'Qty', 'Unit', 'Rate', 'Tax %', 'Tax Amt', 'Total'];

  const tableData = data.items.map((item, index) => [
    (index + 1).toString(),
    item.description,
    item.hsn_code || '-',
    formatNumber(item.quantity),
    item.unit,
    formatNumber(item.unit_price),
    item.tax_rate ? `${item.tax_rate}%` : '-',
    formatNumber(item.tax_amount),
    formatNumber(item.total),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [tableColumns],
    body: tableData,
    theme: 'grid',
    headStyles: { 
      fillColor: [0, 102, 153], 
      textColor: 255, 
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
      cellPadding: 3
    },
    styles: { 
      fontSize: 8, 
      cellPadding: 2.5,
      lineColor: [180, 180, 180],
      lineWidth: 0.2,
      textColor: [33, 37, 41],
      overflow: 'linebreak'
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250]
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 'auto', minCellWidth: 35 },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 16, halign: 'right' },
      4: { cellWidth: 14, halign: 'center' },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 14, halign: 'center' },
      7: { cellWidth: 22, halign: 'right' },
      8: { cellWidth: 26, halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // === TOTALS SECTION ===
  const totalsBoxWidth = 90;
  const totalsX = pageWidth - margin - totalsBoxWidth;
  const valueX = pageWidth - margin - 5;
  
  // Draw totals box
  doc.setDrawColor(0, 102, 153);
  doc.setLineWidth(0.5);
  let totalsHeight = 35;
  if (data.discountPercent && data.discountPercent > 0) totalsHeight += 10;
  doc.roundedRect(totalsX - 5, yPos - 5, totalsBoxWidth + 5, totalsHeight, 2, 2, 'S');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(33, 37, 41);
  
  // Subtotal
  doc.text('Subtotal:', totalsX, yPos);
  doc.text(formatCurrency(data.subtotal), valueX, yPos, { align: 'right' });
  yPos += 8;

  // Discount if applicable
  if (data.discountPercent && data.discountPercent > 0) {
    doc.text(`Discount (${data.discountPercent}%):`, totalsX, yPos);
    doc.text(`- ${formatCurrency(data.discountAmount || 0)}`, valueX, yPos, { align: 'right' });
    yPos += 8;
  }

  // Tax
  doc.text('Tax (GST):', totalsX, yPos);
  doc.text(formatCurrency(data.taxAmount), valueX, yPos, { align: 'right' });
  yPos += 10;

  // Total with emphasis
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 102, 153);
  doc.text('Total:', totalsX, yPos);
  doc.text(formatCurrency(data.totalAmount), valueX, yPos, { align: 'right' });
  doc.setTextColor(33, 37, 41);
  yPos += 15;

  // === BANK DETAILS ===
  if (data.bankDetails && data.bankDetails.bankName) {
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 6;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text('Bank Details:', margin, yPos);
    doc.setTextColor(33, 37, 41);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    yPos += 5;
    
    doc.text(`Bank: ${data.bankDetails.bankName}`, margin, yPos);
    yPos += 4;
    doc.text(`A/C No: ${data.bankDetails.bankAccount}`, margin, yPos);
    yPos += 4;
    doc.text(`IFSC: ${data.bankDetails.bankIfsc}`, margin, yPos);
    if (data.bankDetails.bankLocation) {
      yPos += 4;
      doc.text(`Branch: ${data.bankDetails.bankLocation}`, margin, yPos);
    }
    yPos += 8;
  }

  // === NOTES ===
  if (data.notes) {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 6;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text('Notes:', margin, yPos);
    doc.setTextColor(33, 37, 41);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    yPos += 5;
    const notesLines = doc.splitTextToSize(data.notes, pageWidth - 30);
    doc.text(notesLines, margin, yPos);
    yPos += notesLines.length * 4 + 5;
  }

  // === TERMS & CONDITIONS ===
  if (data.terms) {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 6;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text('Terms & Conditions:', margin, yPos);
    doc.setTextColor(33, 37, 41);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    yPos += 5;
    const termsLines = doc.splitTextToSize(data.terms, pageWidth - 30);
    doc.text(termsLines, margin, yPos);
  }

  // Save PDF
  const fileName = `${getDocumentTitle(data.documentType).replace(/\s+/g, '_')}_${data.documentNumber}.pdf`;
  doc.save(fileName);
};

export type { DocumentData, DocumentItem };

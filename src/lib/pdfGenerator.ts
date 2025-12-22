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

export const generateDocumentPDF = async (data: DocumentData): Promise<void> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Header - Document Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(getDocumentTitle(data.documentType), pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Company Logo (if available)
  if (data.companyLogo) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = data.companyLogo!;
      });
      doc.addImage(img, 'PNG', 15, yPos, 30, 30);
    } catch {
      // Skip logo if it fails to load
    }
  }

  // Supplier Details (Left side)
  const supplierX = data.companyLogo ? 50 : 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('From:', supplierX, yPos);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  yPos += 6;
  if (data.companyName) {
    doc.text(data.companyName, supplierX, yPos);
    yPos += 5;
  }
  if (data.companyAddress) {
    const addressLines = doc.splitTextToSize(data.companyAddress, 70);
    doc.text(addressLines, supplierX, yPos);
    yPos += addressLines.length * 5;
  }
  if (data.companyGstin) {
    doc.text(`GSTIN: ${data.companyGstin}`, supplierX, yPos);
    yPos += 5;
  }

  // Document Details (Right side)
  const rightX = pageWidth - 15;
  let rightY = 35;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.documentType.includes('invoice') ? 'Invoice' : 'Note'} No:`, rightX, rightY, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  rightY += 5;
  doc.text(data.documentNumber, rightX, rightY, { align: 'right' });
  rightY += 8;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', rightX, rightY, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  rightY += 5;
  doc.text(data.issueDate, rightX, rightY, { align: 'right' });
  
  if (data.dueDate) {
    rightY += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Due Date:', rightX, rightY, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    rightY += 5;
    doc.text(data.dueDate, rightX, rightY, { align: 'right' });
  }

  if (data.referenceInvoiceNumber) {
    rightY += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Ref Invoice:', rightX, rightY, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    rightY += 5;
    doc.text(data.referenceInvoiceNumber, rightX, rightY, { align: 'right' });
    if (data.referenceInvoiceDate) {
      rightY += 5;
      doc.text(`(${data.referenceInvoiceDate})`, rightX, rightY, { align: 'right' });
    }
  }

  yPos = Math.max(yPos + 10, rightY + 10);

  // Buyer Details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 15, yPos);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  yPos += 6;
  doc.text(data.buyerName, 15, yPos);
  yPos += 5;
  if (data.buyerAddress) {
    const addressLines = doc.splitTextToSize(data.buyerAddress, 100);
    doc.text(addressLines, 15, yPos);
    yPos += addressLines.length * 5;
  }
  if (data.buyerGstin) {
    doc.text(`GSTIN: ${data.buyerGstin}`, 15, yPos);
    yPos += 5;
  }
  if (data.buyerPhone) {
    doc.text(`Phone: ${data.buyerPhone}`, 15, yPos);
    yPos += 5;
  }
  if (data.buyerEmail) {
    doc.text(`Email: ${data.buyerEmail}`, 15, yPos);
    yPos += 5;
  }

  // Reason (for debit/credit notes)
  if (data.reason) {
    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Reason:', 15, yPos);
    doc.setFont('helvetica', 'normal');
    yPos += 5;
    const reasonLines = doc.splitTextToSize(data.reason, pageWidth - 30);
    doc.text(reasonLines, 15, yPos);
    yPos += reasonLines.length * 5;
  }

  yPos += 10;

  // Items Table
  const tableColumns = [
    { header: '#', dataKey: 'sno' },
    { header: 'Description', dataKey: 'description' },
    { header: 'HSN', dataKey: 'hsn' },
    { header: 'Qty', dataKey: 'qty' },
    { header: 'Unit', dataKey: 'unit' },
    { header: 'Rate', dataKey: 'rate' },
    { header: 'Tax %', dataKey: 'taxRate' },
    { header: 'Tax Amt', dataKey: 'taxAmt' },
    { header: 'Total', dataKey: 'total' },
  ];

  const tableData = data.items.map((item, index) => ({
    sno: (index + 1).toString(),
    description: item.description,
    hsn: item.hsn_code || '-',
    qty: item.quantity.toString(),
    unit: item.unit,
    rate: `₹${item.unit_price.toFixed(2)}`,
    taxRate: item.tax_rate ? `${item.tax_rate}%` : '-',
    taxAmt: `₹${item.tax_amount.toFixed(2)}`,
    total: `₹${item.total.toFixed(2)}`,
  }));

  autoTable(doc, {
    startY: yPos,
    head: [tableColumns.map(col => col.header)],
    body: tableData.map(row => tableColumns.map(col => row[col.dataKey as keyof typeof row])),
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 50 },
      2: { cellWidth: 20 },
      3: { cellWidth: 15 },
      4: { cellWidth: 15 },
      5: { cellWidth: 20 },
      6: { cellWidth: 15 },
      7: { cellWidth: 20 },
      8: { cellWidth: 25 },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Totals (Right aligned)
  const totalsX = pageWidth - 60;
  doc.setFontSize(10);
  
  doc.text('Subtotal:', totalsX, yPos);
  doc.text(`₹${data.subtotal.toFixed(2)}`, pageWidth - 15, yPos, { align: 'right' });
  yPos += 6;

  if (data.discountPercent && data.discountPercent > 0) {
    doc.text(`Discount (${data.discountPercent}%):`, totalsX, yPos);
    doc.text(`-₹${(data.discountAmount || 0).toFixed(2)}`, pageWidth - 15, yPos, { align: 'right' });
    yPos += 6;
  }

  doc.text('Tax:', totalsX, yPos);
  doc.text(`₹${data.taxAmount.toFixed(2)}`, pageWidth - 15, yPos, { align: 'right' });
  yPos += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total:', totalsX, yPos);
  doc.text(`₹${data.totalAmount.toFixed(2)}`, pageWidth - 15, yPos, { align: 'right' });
  yPos += 15;

  // Bank Details (for invoices)
  if (data.bankDetails && data.bankDetails.bankName) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Bank Details:', 15, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    yPos += 6;
    doc.text(`Bank: ${data.bankDetails.bankName}`, 15, yPos);
    yPos += 5;
    doc.text(`A/C No: ${data.bankDetails.bankAccount}`, 15, yPos);
    yPos += 5;
    doc.text(`IFSC: ${data.bankDetails.bankIfsc}`, 15, yPos);
    if (data.bankDetails.bankLocation) {
      yPos += 5;
      doc.text(`Branch: ${data.bankDetails.bankLocation}`, 15, yPos);
    }
    yPos += 10;
  }

  // Notes
  if (data.notes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Notes:', 15, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    yPos += 6;
    const notesLines = doc.splitTextToSize(data.notes, pageWidth - 30);
    doc.text(notesLines, 15, yPos);
    yPos += notesLines.length * 5 + 5;
  }

  // Terms & Conditions
  if (data.terms) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Terms & Conditions:', 15, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    yPos += 6;
    const termsLines = doc.splitTextToSize(data.terms, pageWidth - 30);
    doc.text(termsLines, 15, yPos);
  }

  // Save PDF
  const fileName = `${getDocumentTitle(data.documentType).replace(/\s+/g, '_')}_${data.documentNumber}.pdf`;
  doc.save(fileName);
};

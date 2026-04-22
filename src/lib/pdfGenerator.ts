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
  companyPhone?: string;
  companyEmail?: string;
  companySlogan?: string;

  buyerName: string;
  buyerAddress: string;
  buyerGstin: string;
  buyerEmail?: string;
  buyerPhone?: string;

  // Purchase-order specific (rendered in the secondary header strip)
  requisitioner?: string;
  shippedVia?: string;
  fobPoint?: string;
  paymentTerms?: string;
  // Optional separate ship-to (defaults to buyer address if absent)
  shipToName?: string;
  shipToAddress?: string;
  shipToPhone?: string;
  shipToEmail?: string;
  // Footer authorization line on POs
  authorizedByName?: string;

  items: DocumentItem[];

  subtotal: number;
  discountPercent?: number;
  discountAmount?: number;
  taxAmount: number;
  totalAmount: number;
  shippingHandling?: number;
  otherCharges?: number;

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

  // Load company logo:
  //  - explicit `null` from caller → skip logo entirely (e.g. enterprise PO header
  //    where the buyer's own company name/GSTIN block replaces the platform logo)
  //  - provided string → use as-is
  //  - undefined / not provided → fall back to platform default
  let logoData: string | null = null;
  if (data.companyLogo === null) {
    logoData = null;
  } else if (data.companyLogo) {
    logoData = data.companyLogo;
  } else {
    logoData = await loadLogo();
  }

  // Purchase Orders use a dedicated, classic procurement layout (TO / SHIP TO /
  // P.O NUMBER strip → secondary metadata strip → items grid → totals box →
  // footer notes & authorization line). Other document types continue to use
  // the existing free-form header below.
  if (data.documentType === 'purchase_order') {
    await renderPurchaseOrder(doc, data, logoData);
    const fileName = `${getDocumentTitle(data.documentType).replace(/\s+/g, '_')}_${data.documentNumber}.pdf`;
    doc.save(fileName);
    return;
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
  
  // POs are handled by renderPurchaseOrder() above; this branch only runs for
  // invoices and notes. Cast through string so TS doesn't flag the literal as
  // unreachable now that 'purchase_order' has been narrowed away.
  const docLabel = (data.documentType as string) === 'purchase_order' ? 'PO No:'
                   : data.documentType.includes('invoice') ? 'Invoice No:'
                   : 'Note No:';
  
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
  const toLabel = (data.documentType as string) === 'purchase_order' ? 'Vendor:' : 'Bill To:';
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

/* ============================================================================
 * Purchase Order renderer
 * ----------------------------------------------------------------------------
 * Classic 3-column header layout matching standard procurement templates:
 *
 *   ┌──────────────────┬──────────────────┬──────────────────┐
 *   │ TO               │ SHIP TO          │ P.O NUMBER       │
 *   ├──────────────────┴──────────────────┴──────────────────┤
 *   │ P.O DATE │ REQUISITIONER │ SHIPPED VIA │ F.O.B │ TERMS │
 *   ├────────────────────────────────────────────────────────┤
 *   │ Qty │ Unit │ Description       │  Unit Price │  Total  │
 *   └────────────────────────────────────────────────────────┘
 *
 * The buyer (FROM) appears in the top-right block above the strip;
 * the supplier (TO) and ship-to occupy the first two cells of the strip.
 * ========================================================================== */
async function renderPurchaseOrder(
  doc: jsPDF,
  data: DocumentData,
  logoData: string | null,
): Promise<void> {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let yPos = 14;

  // ---- Top band: title (left) + buyer/company identity (right) -------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(20, 20, 20);
  doc.text('PURCHASE ORDER', margin, yPos + 8);

  // Optional small logo immediately under the title
  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', margin, yPos + 12, 28, 12);
    } catch {
      /* ignore logo failures */
    }
  }

  // Buyer identity block (right-aligned)
  const rightX = pageWidth - margin;
  let topRightY = yPos + 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  doc.text((data.companyName || 'COMPANY NAME').toUpperCase(), rightX, topRightY, { align: 'right' });
  topRightY += 5;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(110, 110, 110);
  if (data.companySlogan) {
    doc.text(data.companySlogan, rightX, topRightY, { align: 'right' });
    topRightY += 4;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);
  if (data.companyAddress) {
    const addrLines = doc.splitTextToSize(data.companyAddress, 80);
    addrLines.forEach((line: string) => {
      doc.text(line, rightX, topRightY, { align: 'right' });
      topRightY += 4;
    });
  }
  if (data.companyPhone) {
    doc.text(`Phone: ${data.companyPhone}`, rightX, topRightY, { align: 'right' });
    topRightY += 4;
  }
  if (data.companyEmail) {
    doc.text(`Email: ${data.companyEmail}`, rightX, topRightY, { align: 'right' });
    topRightY += 4;
  }
  if (data.companyGstin) {
    doc.setFont('helvetica', 'bold');
    doc.text(`GSTIN: ${data.companyGstin}`, rightX, topRightY, { align: 'right' });
    topRightY += 4;
  }

  yPos = Math.max(yPos + 30, topRightY + 4);

  // ---- Strip 1: TO | SHIP TO | P.O NUMBER ----------------------------------
  // Column proportions: 38% | 38% | 24%
  const col1W = Math.round(contentWidth * 0.38);
  const col2W = Math.round(contentWidth * 0.38);
  const col3W = contentWidth - col1W - col2W;
  const headerH = 6;

  // Header bar (filled black, white text)
  doc.setFillColor(20, 20, 20);
  doc.rect(margin, yPos, contentWidth, headerH, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('TO', margin + 3, yPos + 4.2);
  doc.text('SHIP TO', margin + col1W + 3, yPos + 4.2);
  doc.text('P.O NUMBER', margin + col1W + col2W + 3, yPos + 4.2);
  yPos += headerH;

  // Body cells
  const bodyHeight = 32;
  doc.setDrawColor(20, 20, 20);
  doc.setLineWidth(0.4);
  doc.rect(margin, yPos, col1W, bodyHeight);
  doc.rect(margin + col1W, yPos, col2W, bodyHeight);
  doc.rect(margin + col1W + col2W, yPos, col3W, bodyHeight);

  const drawParty = (
    x: number,
    y: number,
    width: number,
    name: string,
    address?: string,
    gstin?: string,
    phone?: string,
    email?: string,
  ) => {
    let cy = y + 5;
    doc.setTextColor(20, 20, 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`[${(name || '—').toUpperCase()}]`, x + 3, cy);
    cy += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    if (address) {
      const lines = doc.splitTextToSize(address, width - 6);
      lines.slice(0, 3).forEach((l: string) => {
        doc.text(l, x + 3, cy);
        cy += 3.6;
      });
    }
    if (gstin) {
      doc.setFont('helvetica', 'bold');
      doc.text(`GSTIN: `, x + 3, cy);
      const w = doc.getTextWidth('GSTIN: ');
      doc.setFont('helvetica', 'normal');
      doc.text(gstin, x + 3 + w, cy);
      cy += 3.6;
    }
    if (phone) {
      doc.setFont('helvetica', 'bold');
      doc.text('Phone: ', x + 3, cy);
      const w = doc.getTextWidth('Phone: ');
      doc.setFont('helvetica', 'normal');
      doc.text(phone, x + 3 + w, cy);
      cy += 3.6;
    }
    if (email) {
      doc.setFont('helvetica', 'bold');
      doc.text('Email: ', x + 3, cy);
      const w = doc.getTextWidth('Email: ');
      doc.setFont('helvetica', 'normal');
      doc.text(email, x + 3 + w, cy);
    }
  };

  // TO = supplier (vendor)
  drawParty(margin, yPos, col1W, data.buyerName, data.buyerAddress, data.buyerGstin, data.buyerPhone, data.buyerEmail);

  // SHIP TO = explicit ship-to or fall back to delivery / buyer address
  const shipName = data.shipToName || data.companyName;
  const shipAddr = data.shipToAddress || data.deliveryAddress || data.companyAddress;
  drawParty(margin + col1W, yPos, col2W, shipName, shipAddr, undefined, data.shipToPhone, data.shipToEmail);

  // P.O NUMBER cell
  {
    const x = margin + col1W + col2W;
    doc.setTextColor(20, 20, 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(data.documentNumber, x + 3, yPos + 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(80, 80, 80);
    const help = doc.splitTextToSize(
      'This P.O. number must appear on all related correspondence, shipping papers, and invoices.',
      col3W - 6,
    );
    doc.text(help, x + 3, yPos + 13);
  }

  yPos += bodyHeight + 4;

  // ---- Strip 2: P.O DATE | REQUISITIONER | SHIPPED VIA | F.O.B | TERMS ------
  const stripCols = [
    { label: 'P.O DATE', value: data.issueDate || '' },
    { label: 'REQUISITIONER', value: data.requisitioner || '' },
    { label: 'SHIPPED VIA', value: data.shippedVia || '' },
    { label: 'F.O.B POINT', value: data.fobPoint || '' },
    { label: 'TERMS', value: data.paymentTerms || '' },
  ];
  const stripColW = contentWidth / stripCols.length;

  // Header (black bar)
  doc.setFillColor(20, 20, 20);
  doc.rect(margin, yPos, contentWidth, headerH, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  stripCols.forEach((c, i) => {
    doc.text(c.label, margin + stripColW * i + stripColW / 2, yPos + 4.2, { align: 'center' });
  });
  yPos += headerH;

  // Value row
  const stripValueH = 9;
  doc.setDrawColor(20, 20, 20);
  doc.setLineWidth(0.4);
  doc.setTextColor(20, 20, 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  stripCols.forEach((c, i) => {
    doc.rect(margin + stripColW * i, yPos, stripColW, stripValueH);
    if (c.value) {
      doc.text(c.value, margin + stripColW * i + stripColW / 2, yPos + 6, { align: 'center' });
    }
  });
  yPos += stripValueH + 4;

  // ---- Items table ---------------------------------------------------------
  const tableHead = [['Qty', 'Unit', 'Description', 'Unit Price', 'Total']];
  const tableBody = data.items.map((it) => [
    formatNumber(it.quantity),
    it.unit || '',
    it.description,
    formatNumber(it.unit_price),
    formatNumber(it.total),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [20, 20, 20],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left',
      cellPadding: 2.5,
    },
    styles: {
      fontSize: 9,
      cellPadding: 2.5,
      lineColor: [80, 80, 80],
      lineWidth: 0.2,
      textColor: [20, 20, 20],
      overflow: 'linebreak',
      minCellHeight: 7,
    },
    columnStyles: {
      0: { cellWidth: 16, halign: 'right' },
      1: { cellWidth: 18, halign: 'left' },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });

  yPos = (doc as any).lastAutoTable.finalY + 4;

  // ---- Footer: notes (left) + totals box (right) ---------------------------
  const totalsBoxW = 72;
  const totalsX = pageWidth - margin - totalsBoxW;
  const totalsLabelX = totalsX + 3;
  const totalsValueX = pageWidth - margin - 3;

  // Build totals rows
  const totalsRows: Array<{ label: string; value: number; emphasize?: boolean }> = [
    { label: 'Sub Total', value: data.subtotal || 0 },
    { label: 'Sales Tax', value: data.taxAmount || 0 },
  ];
  if (data.shippingHandling != null) totalsRows.push({ label: 'Shipping & Handling', value: data.shippingHandling });
  if (data.otherCharges != null) totalsRows.push({ label: 'Other', value: data.otherCharges });
  totalsRows.push({ label: 'Total', value: data.totalAmount || 0, emphasize: true });

  const rowH = 7;
  const totalsHeight = rowH * totalsRows.length;
  doc.setDrawColor(20, 20, 20);
  doc.setLineWidth(0.4);
  totalsRows.forEach((row, i) => {
    const rY = yPos + rowH * i;
    doc.rect(totalsX, rY, totalsBoxW * 0.55, rowH);
    doc.rect(totalsX + totalsBoxW * 0.55, rY, totalsBoxW * 0.45, rowH);
    doc.setFont('helvetica', row.emphasize ? 'bold' : 'normal');
    doc.setFontSize(row.emphasize ? 10 : 9);
    doc.setTextColor(20, 20, 20);
    doc.text(row.label, totalsLabelX, rY + 5);
    doc.text(formatCurrency(row.value), totalsValueX, rY + 5, { align: 'right' });
  });

  // Footer notes (left side, parallel to totals)
  const noteX = margin;
  const noteW = totalsX - margin - 6;
  let noteY = yPos;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(20, 20, 20);
  const defaultBullets = [
    'Please send two copies of your invoice.',
    'Enter this order in accordance with the prices, terms, delivery method, and specifications listed above.',
    'Please notify us immediately if you are unable to ship as specified.',
    'Send all correspondence to the buyer address printed in the header.',
  ];
  defaultBullets.forEach((b) => {
    const lines = doc.splitTextToSize(`•  ${b}`, noteW);
    doc.text(lines, noteX, noteY + 4);
    noteY += lines.length * 4 + 1;
  });

  yPos = Math.max(yPos + totalsHeight, noteY) + 8;

  // ---- Buyer-supplied Terms & Conditions (full width) ---------------------
  if (data.terms) {
    if (yPos > pageHeight - 50) {
      doc.addPage();
      yPos = margin;
    }
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, yPos, contentWidth, 6, 'F');
    doc.setTextColor(20, 20, 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('TERMS & CONDITIONS', margin + 3, yPos + 4.2);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const termsLines = doc.splitTextToSize(data.terms, contentWidth - 4);
    termsLines.forEach((l: string) => {
      if (yPos > pageHeight - 25) {
        doc.addPage();
        yPos = margin;
      }
      doc.text(l, margin + 2, yPos);
      yPos += 4;
    });
    yPos += 4;
  }

  // ---- Notes (operational, separate from T&C) -----------------------------
  if (data.notes) {
    if (yPos > pageHeight - 30) {
      doc.addPage();
      yPos = margin;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text('Notes:', margin, yPos);
    yPos += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(20, 20, 20);
    const notesLines = doc.splitTextToSize(data.notes, contentWidth);
    notesLines.forEach((l: string) => {
      if (yPos > pageHeight - 25) {
        doc.addPage();
        yPos = margin;
      }
      doc.text(l, margin, yPos);
      yPos += 4;
    });
  }

  // ---- Authorization line (bottom) ----------------------------------------
  const authY = pageHeight - 22;
  doc.setDrawColor(20, 20, 20);
  doc.setLineWidth(0.3);
  doc.line(margin + 30, authY, margin + 110, authY);
  doc.line(pageWidth - margin - 60, authY, pageWidth - margin - 10, authY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(20, 20, 20);
  doc.text(
    `Authorized by ${data.authorizedByName || ''}`.trim(),
    margin + 70,
    authY + 5,
    { align: 'center' },
  );
  doc.text('Date', pageWidth - margin - 35, authY + 5, { align: 'center' });
}

export type { DocumentData, DocumentItem };

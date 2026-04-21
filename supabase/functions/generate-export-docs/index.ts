/**
 * generate-export-docs
 * Server-side PDF generation for international export documents:
 * Commercial Invoice, Packing List, Certificate of Origin, Bill of Lading.
 *
 * Renders structured, boxed templates (matching industry-standard formats)
 * via jsPDF, uploads to `export-documents` bucket, records in `export_documents`,
 * and returns a signed URL.
 */
import { createClient } from 'npm:@supabase/supabase-js@2.95.0';
import { jsPDF } from 'npm:jspdf@2.5.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DOC_LABELS: Record<string, string> = {
  commercial_invoice: 'COMMERCIAL INVOICE',
  packing_list: 'EXPORT PACKING LIST',
  certificate_of_origin: 'CERTIFICATE OF ORIGIN',
  bill_of_lading: 'BILL OF LADING',
};

// ============ PDF helpers ============
const PAGE_MARGIN = 32;
const LINE = 0.4;

function box(doc: jsPDF, x: number, y: number, w: number, h: number) {
  doc.setLineWidth(LINE);
  doc.rect(x, y, w, h);
}

function labelValue(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value?: string | null,
) {
  box(doc, x, y, w, h);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 90, 140);
  doc.text(label, x + 3, y + 8);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const v = (value ?? '').toString();
  if (v) {
    const lines = doc.splitTextToSize(v, w - 6);
    doc.text(lines.slice(0, Math.max(1, Math.floor((h - 12) / 10))), x + 3, y + 18);
  }
}

function blockHeader(doc: jsPDF, x: number, y: number, w: number, label: string) {
  box(doc, x, y, w, 12);
  doc.setFillColor(240, 245, 250);
  doc.rect(x, y, w, 12, 'F');
  box(doc, x, y, w, 12);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 90, 140);
  doc.text(label, x + w / 2, y + 8, { align: 'center' });
  doc.setTextColor(0, 0, 0);
}

function multiLine(doc: jsPDF, x: number, y: number, w: number, h: number, lines: string[]) {
  box(doc, x, y, w, h);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  let yy = y + 12;
  for (const ln of lines) {
    if (yy > y + h - 2) break;
    const wrapped = doc.splitTextToSize(ln, w - 6);
    for (const wln of wrapped) {
      if (yy > y + h - 2) break;
      doc.text(wln, x + 3, yy);
      yy += 10;
    }
  }
}

// ============ Templates ============

function renderCommercialInvoice(doc: jsPDF, ctx: any) {
  const W = doc.internal.pageSize.getWidth();
  const x = PAGE_MARGIN;
  const innerW = W - PAGE_MARGIN * 2;
  let y = PAGE_MARGIN;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('COMMERCIAL INVOICE', W / 2, y + 12, { align: 'center' });
  y += 20;

  // Top row: Exporter | Invoice meta
  const half = innerW / 2;
  labelValue(doc, x, y, half, 60, 'Exporter', ctx.exporterBlock);
  // Right meta block: Invoice No & Date | Reference
  labelValue(doc, x + half, y, half / 2, 30, 'Invoice Number & Date', `${ctx.docNumber}\n${ctx.today}`);
  labelValue(doc, x + half + half / 2, y, half / 2, 30, 'Bill of Lading Number', ctx.bolRef);
  labelValue(doc, x + half, y + 30, half / 2, 30, 'Reference', ctx.poNumber);
  labelValue(doc, x + half + half / 2, y + 30, half / 2, 30, 'Buyer Reference', ctx.buyerRef);
  y += 60;

  // Consignee | Buyer
  labelValue(doc, x, y, half, 50, 'Consignee', ctx.consigneeBlock);
  labelValue(doc, x + half, y, half, 50, 'Buyer (If not Consignee)', ctx.buyerBlock);
  y += 50;

  // Shipping grid
  const q = innerW / 4;
  labelValue(doc, x, y, q, 22, 'Method of Dispatch', ctx.shipmentMode);
  labelValue(doc, x + q, y, q, 22, 'Type of Shipment', ctx.shipmentType);
  labelValue(doc, x + 2 * q, y, q, 22, 'Country Of Origin of Goods', ctx.originCountry);
  labelValue(doc, x + 3 * q, y, q, 22, 'Country of Final Destination', ctx.destinationCountry);
  y += 22;
  labelValue(doc, x, y, q, 22, 'Vessel / Aircraft', ctx.vessel);
  labelValue(doc, x + q, y, q, 22, 'Voyage No', ctx.voyage);
  labelValue(doc, x + 2 * q, y, half, 22, 'Terms / Method of Payment', ctx.paymentTerms);
  y += 22;
  labelValue(doc, x, y, q, 22, 'Port of Loading', ctx.pol);
  labelValue(doc, x + q, y, q, 22, 'Date of Departure', ctx.departureDate);
  labelValue(doc, x + 2 * q, y, q, 22, 'Marine Cover Policy No', ctx.marineCover);
  labelValue(doc, x + 3 * q, y, q, 22, 'Letter Of Credit No', ctx.lcNumber);
  y += 22;
  labelValue(doc, x, y, q, 22, 'Port of Discharge', ctx.pod);
  labelValue(doc, x + q, y, q, 22, 'Final Destination', ctx.finalDestination);
  labelValue(doc, x + 2 * q, y, half, 22, 'Incoterms® 2020', ctx.incoterms);
  y += 22;

  // Items table
  const cols = [
    { label: 'Product Code', w: 60 },
    { label: 'Description of Goods', w: 0 },
    { label: 'HS Code', w: 55 },
    { label: 'Unit Qty', w: 45 },
    { label: 'Unit Type', w: 45 },
    { label: 'Price', w: 60 },
    { label: 'Amount', w: 65 },
  ];
  const fixed = cols.reduce((s, c) => s + c.w, 0);
  cols[1].w = innerW - fixed;
  let cx = x;
  doc.setFillColor(240, 245, 250);
  doc.rect(x, y, innerW, 14, 'F');
  box(doc, x, y, innerW, 14);
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(60, 90, 140);
  for (const c of cols) {
    doc.text(c.label, cx + c.w / 2, y + 9, { align: 'center' });
    doc.line(cx, y, cx, y + 14);
    cx += c.w;
  }
  doc.setTextColor(0, 0, 0);
  y += 14;

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  let tableTop = y;
  const rowH = 16;
  const maxRows = 18;
  ctx.items.slice(0, maxRows).forEach((it: any, i: number) => {
    cx = x;
    const vals = [
      String(i + 1).padStart(3, '0'),
      it.description || '',
      it.hsn_code || ctx.hsCode || '—',
      String(it.quantity ?? ''),
      it.unit || 'PCS',
      `${ctx.currency} ${Number(it.unit_price || 0).toFixed(2)}`,
      `${ctx.currency} ${Number(it.total || 0).toFixed(2)}`,
    ];
    cols.forEach((c, idx) => {
      const text = doc.splitTextToSize(vals[idx], c.w - 4);
      doc.text(text.slice(0, 1), cx + 3, y + 11);
      doc.line(cx, y, cx, y + rowH);
      cx += c.w;
    });
    y += rowH;
  });
  // fill remaining rows blank
  for (let r = ctx.items.length; r < 8; r++) {
    cx = x;
    cols.forEach((c) => { doc.line(cx, y, cx, y + rowH); cx += c.w; });
    y += rowH;
  }
  box(doc, x, tableTop, innerW, y - tableTop);

  // Totals
  doc.setFillColor(248, 248, 248);
  doc.rect(x, y, innerW, 14, 'F'); box(doc, x, y, innerW, 14);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.text('TOTAL', x + innerW - 130, y + 9);
  doc.text(`${ctx.currency} ${Number(ctx.total).toFixed(2)}`, x + innerW - 5, y + 9, { align: 'right' });
  y += 14;

  // Footer blocks
  labelValue(doc, x, y, half, 30, 'Additional Info', ctx.notes);
  labelValue(doc, x + half, y, half / 2, 15, 'Incoterms® 2020', ctx.incoterms);
  labelValue(doc, x + half + half / 2, y, half / 2, 15, 'Currency', ctx.currency);
  labelValue(doc, x + half, y + 15, half, 15, 'Signatory Company', ctx.exporterName);
  y += 30;
  labelValue(doc, x, y, half, 50, 'Bank Details', ctx.bankDetails);
  labelValue(doc, x + half, y, half, 25, 'Name of Authorized Signatory', '');
  labelValue(doc, x + half, y + 25, half, 25, 'Signature', '');
}

function renderPackingList(doc: jsPDF, ctx: any) {
  const W = doc.internal.pageSize.getWidth();
  const x = PAGE_MARGIN;
  const innerW = W - PAGE_MARGIN * 2;
  let y = PAGE_MARGIN;

  doc.setFontSize(18); doc.setFont('helvetica', 'bold');
  doc.text('EXPORT PACKING LIST', W / 2, y + 14, { align: 'center' });
  doc.setLineWidth(0.6); doc.line(x + innerW / 4, y + 18, x + (innerW * 3) / 4, y + 18);
  y += 30;

  const half = innerW / 2;
  // Exporter / Packing list meta
  multiLine(doc, x, y, half, 70, ['Exporter:', ctx.exporterName, ...ctx.exporterAddressLines]);
  multiLine(doc, x + half, y, half, 70, [
    `Packing List No: ${ctx.docNumber}`,
    `Date: ${ctx.today}`,
  ]);
  y += 70;

  // Consignee / Shipping meta
  multiLine(doc, x, y, half, 110, ['Consignee:', ctx.consigneeName, ...ctx.consigneeAddressLines]);
  multiLine(doc, x + half, y, half, 110, [
    `Invoice No.: ${ctx.docNumber}`,
    `Buyer Order No: ${ctx.poNumber}`,
    `Port of Loading: ${ctx.pol}`,
    `Port of Discharge: ${ctx.pod}`,
    `Container No.: ${ctx.containerNo}`,
    `Seal No: ${ctx.sealNo}`,
  ]);
  y += 116;

  // Items table
  const cols = [
    { label: 'Item No', w: 55 },
    { label: 'Description of Goods', w: 0 },
    { label: 'Qty', w: 60 },
    { label: 'No. of Cartons', w: 70 },
    { label: 'Net Weight (KGS)', w: 75 },
    { label: 'Gross Weight', w: 65 },
    { label: 'Dimensions (L x W x H) CM', w: 95 },
  ];
  const fixed = cols.reduce((s, c) => s + c.w, 0);
  cols[1].w = innerW - fixed;
  let cx = x;
  doc.setFillColor(240, 245, 250);
  doc.rect(x, y, innerW, 16, 'F'); box(doc, x, y, innerW, 16);
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(60, 90, 140);
  for (const c of cols) {
    const ll = doc.splitTextToSize(c.label, c.w - 4);
    doc.text(ll, cx + c.w / 2, y + (ll.length > 1 ? 7 : 10), { align: 'center' });
    doc.line(cx, y, cx, y + 16);
    cx += c.w;
  }
  doc.setTextColor(0, 0, 0);
  y += 16;

  let totalQty = 0, totalCartons = 0, totalNet = 0, totalGross = 0;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  const rowH = 18;
  const start = y;
  ctx.items.slice(0, 12).forEach((it: any, i: number) => {
    cx = x;
    const qty = Number(it.quantity || 0);
    const cartons = Math.max(1, Math.ceil(qty / 20));
    const net = +(qty * 0.5).toFixed(2);
    const gross = +(net * 1.12).toFixed(2);
    totalQty += qty; totalCartons += cartons; totalNet += net; totalGross += gross;
    const vals = [
      String(i + 1),
      it.description || '',
      `${qty} ${it.unit || 'PCS'}`,
      String(cartons),
      net.toFixed(2),
      gross.toFixed(2),
      '60 x 40 x 30',
    ];
    cols.forEach((c, idx) => {
      const t = doc.splitTextToSize(vals[idx], c.w - 4);
      doc.text(t.slice(0, 1), cx + c.w / 2, y + 12, { align: 'center' });
      doc.line(cx, y, cx, y + rowH);
      cx += c.w;
    });
    y += rowH;
  });
  // TOTAL row
  cx = x;
  doc.setFillColor(248, 248, 248);
  doc.rect(x, y, innerW, rowH, 'F');
  const totals = ['', 'TOTAL', `${totalQty} PCS`, String(totalCartons), totalNet.toFixed(2), totalGross.toFixed(2), ''];
  doc.setFont('helvetica', 'bold');
  cols.forEach((c, idx) => {
    doc.text(totals[idx], cx + c.w / 2, y + 12, { align: 'center' });
    doc.line(cx, y, cx, y + rowH);
    cx += c.w;
  });
  y += rowH;
  box(doc, x, start, innerW, y - start);

  y += 12;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  doc.text(`Total Packages: ${totalCartons} Cartons`, x, y); y += 14;
  doc.text(`Total Net Weight: ${totalNet.toFixed(2)} KGS`, x, y); y += 14;
  doc.text(`Total Gross Weight: ${totalGross.toFixed(2)} KGS`, x, y); y += 14;
  doc.text(`HS Code: ${ctx.hsCode || '—'}`, x, y);
}

function renderCertificateOfOrigin(doc: jsPDF, ctx: any) {
  const W = doc.internal.pageSize.getWidth();
  const x = PAGE_MARGIN;
  const innerW = W - PAGE_MARGIN * 2;
  let y = PAGE_MARGIN;

  doc.setFontSize(16); doc.setFont('helvetica', 'bold');
  doc.text('CERTIFICATE OF ORIGIN', W / 2, y + 14, { align: 'center' });
  y += 26;

  const half = innerW / 2;
  labelValue(doc, x, y, half, 80, 'Exporter', ctx.exporterBlock);
  labelValue(doc, x + half, y, half, 22, 'Pages', '1 of 1');
  labelValue(doc, x + half, y + 22, half / 2, 30, 'Export Invoice Number & Date', `${ctx.docNumber}\n${ctx.today}`);
  labelValue(doc, x + half + half / 2, y + 22, half / 2, 30, 'Letter Of Credit No', ctx.lcNumber);
  y += 80;

  labelValue(doc, x, y, half, 70, 'Consignee', ctx.consigneeBlock);
  labelValue(doc, x + half, y, half, 70, 'Buyer (If not Consignee)', ctx.buyerBlock);
  y += 70;

  // Shipping grid (left col) | empty (right col holds signatures later)
  const q = half / 2;
  labelValue(doc, x, y, q, 22, 'Method of Dispatch', ctx.shipmentMode);
  labelValue(doc, x + q, y, q, 22, 'Type of Shipment', ctx.shipmentType);
  y += 22;
  labelValue(doc, x, y, q, 22, 'Vessel / Aircraft', ctx.vessel);
  labelValue(doc, x + q, y, q, 22, 'Voyage No', ctx.voyage);
  y += 22;
  labelValue(doc, x, y, q, 22, 'Port of Loading', ctx.pol);
  labelValue(doc, x + q, y, q, 22, 'Date of Departure', ctx.departureDate);
  y += 22;
  labelValue(doc, x, y, q, 22, 'Port of Discharge', ctx.pod);
  labelValue(doc, x + q, y, q, 22, 'Final Destination', ctx.finalDestination);
  y += 22;

  // Items table (compact)
  const cols = [
    { label: 'Marks & Numbers', w: 80 },
    { label: 'Kind & No of Packages', w: 90 },
    { label: 'Description of Goods', w: 0 },
    { label: 'Tariff Code', w: 60 },
    { label: 'Gross Weight (Kg)', w: 80 },
  ];
  const fixed = cols.reduce((s, c) => s + c.w, 0);
  cols[2].w = innerW - fixed;
  let cx = x;
  doc.setFillColor(240, 245, 250);
  doc.rect(x, y, innerW, 16, 'F'); box(doc, x, y, innerW, 16);
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(60, 90, 140);
  for (const c of cols) {
    doc.text(doc.splitTextToSize(c.label, c.w - 4), cx + c.w / 2, y + 10, { align: 'center' });
    doc.line(cx, y, cx, y + 16);
    cx += c.w;
  }
  doc.setTextColor(0, 0, 0);
  y += 16;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  const rowH = 18;
  const start = y;
  ctx.items.slice(0, 6).forEach((it: any, i: number) => {
    cx = x;
    const vals = [
      `M/${i + 1}`,
      `${Math.max(1, Math.ceil(Number(it.quantity || 0) / 20))} CTN`,
      it.description || '',
      it.hsn_code || ctx.hsCode || '—',
      ((Number(it.quantity || 0)) * 0.6).toFixed(2),
    ];
    cols.forEach((c, idx) => {
      doc.text(doc.splitTextToSize(vals[idx], c.w - 4).slice(0, 1), cx + 3, y + 12);
      doc.line(cx, y, cx, y + rowH);
      cx += c.w;
    });
    y += rowH;
  });
  for (let r = ctx.items.length; r < 4; r++) {
    cx = x;
    cols.forEach((c) => { doc.line(cx, y, cx, y + rowH); cx += c.w; });
    y += rowH;
  }
  box(doc, x, start, innerW, y - start);

  y += 8;
  // Declarations
  multiLine(doc, x, y, half, 80, [
    'Declaration By The Chamber',
    'The undersigned certifies on the basis of information provided',
    'by the exporter that to the best of its knowledge and belief,',
    'the goods are of designated origin, production or manufacture.',
  ]);
  multiLine(doc, x + half, y, half, 80, [
    'Declaration By The Exporter',
    'I, the undersigned, being duly authorized by the Consignor,',
    `hereby certify that the goods listed originate from ${ctx.originCountry || '—'}.`,
    'The goods were produced/manufactured at',
    ctx.exporterName,
  ]);
  y += 80;
  labelValue(doc, x, y, half, 22, 'Place and Date of Issue', `${ctx.exporterCity || '—'} / ${ctx.today}`);
  labelValue(doc, x + half, y, half, 22, 'Place and Date of Issue', `${ctx.exporterCity || '—'} / ${ctx.today}`);
  y += 22;
  labelValue(doc, x, y, half, 22, 'Signatory Company', ctx.exporterName);
  labelValue(doc, x + half, y, half, 22, 'Signatory Company', ctx.exporterName);
  y += 22;
  labelValue(doc, x, y, half, 22, 'Name of Authorized Signatory', '');
  labelValue(doc, x + half, y, half, 22, 'Name of Authorized Signatory', '');
  y += 22;
  labelValue(doc, x, y, half, 40, 'Signature', '');
  labelValue(doc, x + half, y, half, 40, 'Signature', '');
}

function renderBillOfLading(doc: jsPDF, ctx: any) {
  const W = doc.internal.pageSize.getWidth();
  const x = PAGE_MARGIN;
  const innerW = W - PAGE_MARGIN * 2;
  let y = PAGE_MARGIN;

  // Header
  doc.setFontSize(8); doc.text(`Date: ${ctx.today}`, x + 4, y + 10);
  doc.setFontSize(16); doc.setFont('helvetica', 'bold');
  doc.text('BILL OF LADING', W / 2, y + 14, { align: 'center' });
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text('Page 1 of 1', x + innerW - 4, y + 10, { align: 'right' });
  y += 22;

  const half = innerW / 2;
  // SHIP FROM | BoL Number / Bar code
  blockHeader(doc, x, y, half, 'SHIP FROM');
  blockHeader(doc, x + half, y, half, 'BILL OF LADING NUMBER');
  y += 12;
  multiLine(doc, x, y, half, 70, [
    `Name: ${ctx.exporterName}`,
    `Address: ${ctx.exporterAddressLines[0] || ''}`,
    `City/State/Zip: ${ctx.exporterAddressLines[1] || ''}`,
    `SID#: ${ctx.poNumber}`,
    `FOB: ${ctx.incoterms === 'FOB' ? '☑' : '☐'}`,
  ]);
  multiLine(doc, x + half, y, half, 70, [
    ctx.bolRef,
    '',
    'BAR CODE SPACE',
  ]);
  y += 70;

  // SHIP TO | CARRIER NAME etc.
  blockHeader(doc, x, y, half, 'SHIP TO');
  blockHeader(doc, x + half, y, half, 'CARRIER INFORMATION');
  y += 12;
  multiLine(doc, x, y, half, 80, [
    `Name: ${ctx.consigneeName}`,
    `Location #: ${ctx.poNumber}`,
    `Address: ${ctx.consigneeAddressLines[0] || ''}`,
    `City/State/Zip: ${ctx.consigneeAddressLines[1] || ''}`,
    `CID#: ${ctx.poNumber}`,
    `FOB: ${ctx.incoterms === 'FOB' ? '☑' : '☐'}`,
  ]);
  multiLine(doc, x + half, y, half, 80, [
    `Carrier Name: ${ctx.carrierName}`,
    `Trailer Number: ${ctx.trailerNo}`,
    `Seal Number(s): ${ctx.sealNo}`,
    `SCAC: ${ctx.scac}`,
    `Pro Number: ${ctx.proNumber}`,
  ]);
  y += 80;

  // Third party + Freight charge terms
  blockHeader(doc, x, y, half, 'THIRD PARTY FREIGHT CHARGES BILL TO');
  blockHeader(doc, x + half, y, half, 'FREIGHT CHARGE TERMS (prepaid unless marked)');
  y += 12;
  multiLine(doc, x, y, half, 60, [
    `Name: ${ctx.thirdPartyName || '—'}`,
    'Address:',
    'City/State/Zip:',
    `SPECIAL INSTRUCTIONS: ${ctx.specialInstructions || '—'}`,
  ]);
  multiLine(doc, x + half, y, half, 60, [
    `Prepaid: ☑       Collect: ☐       3rd Party: ☐`,
    '',
    `Master Bill of Lading: ☐ with attached underlying Bills of Lading`,
  ]);
  y += 60;

  // Customer Order Information
  blockHeader(doc, x, y, innerW, 'CUSTOMER ORDER INFORMATION');
  y += 12;
  const orderCols = [
    { label: 'CUSTOMER ORDER NUMBER', w: 160 },
    { label: '# PKGS', w: 60 },
    { label: 'WEIGHT', w: 70 },
    { label: 'PALLET/SLIP (Y/N)', w: 80 },
    { label: 'ADDITIONAL SHIPPER INFO', w: 0 },
  ];
  const fixed = orderCols.reduce((s, c) => s + c.w, 0);
  orderCols[4].w = innerW - fixed;
  doc.setFillColor(240, 245, 250);
  doc.rect(x, y, innerW, 14, 'F'); box(doc, x, y, innerW, 14);
  let cx = x;
  doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(60, 90, 140);
  for (const c of orderCols) {
    doc.text(doc.splitTextToSize(c.label, c.w - 4), cx + c.w / 2, y + 9, { align: 'center' });
    doc.line(cx, y, cx, y + 14);
    cx += c.w;
  }
  doc.setTextColor(0, 0, 0);
  y += 14;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  let totalPkgs = 0, totalWt = 0;
  ctx.items.slice(0, 4).forEach((it: any) => {
    const pkgs = Math.max(1, Math.ceil(Number(it.quantity || 0) / 20));
    const wt = +(Number(it.quantity || 0) * 0.6).toFixed(2);
    totalPkgs += pkgs; totalWt += wt;
    cx = x;
    const vals = [ctx.poNumber, String(pkgs), `${wt} kg`, 'Y', it.description || ''];
    orderCols.forEach((c, idx) => {
      doc.text(doc.splitTextToSize(vals[idx], c.w - 4).slice(0, 1), cx + c.w / 2, y + 11, { align: 'center' });
      doc.line(cx, y, cx, y + 16);
      cx += c.w;
    });
    y += 16;
  });
  // GRAND TOTAL row
  cx = x; doc.setFillColor(248, 248, 248); doc.rect(x, y, innerW, 14, 'F');
  doc.setFont('helvetica', 'bold');
  const tots = ['GRAND TOTAL', String(totalPkgs), `${totalWt.toFixed(2)} kg`, '', ''];
  orderCols.forEach((c, idx) => {
    doc.text(tots[idx], cx + c.w / 2, y + 9, { align: 'center' });
    doc.line(cx, y, cx, y + 14);
    cx += c.w;
  });
  y += 14;

  // Carrier Information / Commodity
  blockHeader(doc, x, y, innerW, 'CARRIER INFORMATION');
  y += 12;
  const carCols = [
    { label: 'HANDLING UNIT QTY', w: 60 },
    { label: 'TYPE', w: 50 },
    { label: 'PACKAGE QTY', w: 60 },
    { label: 'TYPE', w: 50 },
    { label: 'WEIGHT', w: 60 },
    { label: 'H.M. (X)', w: 45 },
    { label: 'COMMODITY DESCRIPTION', w: 0 },
    { label: 'NMFC #', w: 55 },
    { label: 'CLASS', w: 45 },
  ];
  const cf = carCols.reduce((s, c) => s + c.w, 0);
  carCols[6].w = innerW - cf;
  cx = x; doc.setFillColor(240, 245, 250); doc.rect(x, y, innerW, 18, 'F'); box(doc, x, y, innerW, 18);
  doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(60, 90, 140);
  for (const c of carCols) {
    doc.text(doc.splitTextToSize(c.label, c.w - 4), cx + c.w / 2, y + 8, { align: 'center' });
    doc.line(cx, y, cx, y + 18);
    cx += c.w;
  }
  doc.setTextColor(0, 0, 0);
  y += 18;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  ctx.items.slice(0, 4).forEach((it: any) => {
    const pkgs = Math.max(1, Math.ceil(Number(it.quantity || 0) / 20));
    const wt = +(Number(it.quantity || 0) * 0.6).toFixed(2);
    cx = x;
    const vals = [String(pkgs), 'PLT', String(it.quantity || ''), it.unit || 'PCS', `${wt} kg`, '', it.description || '', '—', '70'];
    carCols.forEach((c, idx) => {
      doc.text(doc.splitTextToSize(vals[idx], c.w - 4).slice(0, 1), cx + 2, y + 11);
      doc.line(cx, y, cx, y + 16);
      cx += c.w;
    });
    y += 16;
  });
  // GRAND TOTAL
  cx = x; doc.setFillColor(248, 248, 248); doc.rect(x, y, innerW, 14, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('GRAND TOTAL', x + 4, y + 9);
  doc.text(`${totalPkgs} PLT`, x + 250, y + 9);
  doc.text(`${totalWt.toFixed(2)} kg`, x + 320, y + 9);
  doc.line(x, y, x, y + 14); doc.line(x + innerW, y, x + innerW, y + 14);
  y += 14;

  // Footer notes
  doc.setFontSize(7); doc.setFont('helvetica', 'normal');
  doc.text('NOTE: Liability Limitation for loss or damage in this shipment may be applicable. See 49 U.S.C. 14706(c)(1)(A) and (B).', x, y + 10);
  y += 16;
  multiLine(doc, x, y, half, 50, [
    'SHIPPER SIGNATURE / DATE',
    'This is to certify that the above named materials are properly classified, packaged,',
    'marked and labeled, and are in proper condition for transportation according to',
    'the applicable regulations of the DOT.',
  ]);
  multiLine(doc, x + half, y, half, 50, [
    'CARRIER SIGNATURE / PICKUP DATE',
    'Carrier acknowledges receipt of packages and required placards.',
    'Property described above is received in good order, except as noted.',
  ]);
}

// ============ Main ============

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'No auth' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { purchase_order_id, document_type } = body || {};
    if (!purchase_order_id || !document_type || !DOC_LABELS[document_type]) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid input' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Accept either a user JWT or the service-role key (for system/trigger calls)
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const isServiceCall = token === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!isServiceCall) {
      const supabaseUser = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user } } = await supabaseUser.auth.getUser();
      if (!user) {
        return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: po, error: poErr } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('id', purchase_order_id)
      .maybeSingle();
    if (poErr || !po) throw new Error('Purchase order not found');

    const { data: poItems } = await supabase
      .from('po_items')
      .select('*')
      .eq('po_id', purchase_order_id);

    let req_: any = null;
    if (po.requirement_id) {
      const { data: r } = await supabase
        .from('requirements')
        .select('port_of_loading, port_of_discharge, hs_code, destination_country, incoterms, payment_terms, customer_name, delivery_location')
        .eq('id', po.requirement_id)
        .maybeSingle();
      req_ = r;
    }

    let buyerCo: any = null;
    if (po.buyer_company_id) {
      const { data: bc } = await supabase
        .from('buyer_companies')
        .select('company_name, address, city, state, country, gstin')
        .eq('id', po.buyer_company_id)
        .maybeSingle();
      buyerCo = bc;
    }

    const today = new Date().toISOString().split('T')[0];
    const docNumber = `${document_type.toUpperCase().slice(0, 3)}-${po.po_number}-${Date.now().toString().slice(-5)}`;

    const exporterName = po.vendor_name || '—';
    const exporterAddressLines = (po.vendor_address || '').split(/\n|,/).map((s: string) => s.trim()).filter(Boolean);
    const consigneeName = buyerCo?.company_name || req_?.customer_name || 'Consignee';
    const consigneeAddressLines = [
      buyerCo?.address || po.delivery_address || '',
      [buyerCo?.city, buyerCo?.state, buyerCo?.country].filter(Boolean).join(', '),
    ].filter(Boolean);

    const ctx = {
      docNumber,
      today,
      poNumber: po.po_number,
      currency: po.currency || 'INR',
      total: po.total_amount,
      items: poItems || [],
      notes: po.notes || '',
      incoterms: po.incoterms || req_?.incoterms || '—',
      paymentTerms: req_?.payment_terms || `${po.payment_terms_override_days || 30} days`,
      hsCode: req_?.hs_code || '',
      pol: req_?.port_of_loading || '—',
      pod: req_?.port_of_discharge || '—',
      originCountry: 'India',
      destinationCountry: req_?.destination_country || buyerCo?.country || '—',
      shipmentMode: 'SEA',
      shipmentType: 'FCL',
      vessel: '—',
      voyage: '—',
      departureDate: po.expected_delivery_date || '—',
      finalDestination: req_?.delivery_location || po.delivery_address || '—',
      marineCover: '—',
      lcNumber: '—',
      bolRef: `BOL-${po.po_number}`,
      buyerRef: po.external_po_number || po.po_number,
      bankDetails: 'Bank Name: —\nA/c No: —\nIFSC: —\nSWIFT: —',
      exporterName,
      exporterAddressLines,
      exporterCity: exporterAddressLines[0] || '',
      consigneeName,
      consigneeAddressLines,
      exporterBlock: [exporterName, ...exporterAddressLines, po.vendor_tax_id ? `Tax ID: ${po.vendor_tax_id}` : ''].filter(Boolean).join('\n'),
      consigneeBlock: [consigneeName, ...consigneeAddressLines, buyerCo?.gstin ? `GSTIN: ${buyerCo.gstin}` : ''].filter(Boolean).join('\n'),
      buyerBlock: [consigneeName, ...consigneeAddressLines].filter(Boolean).join('\n'),
      // BoL specific
      carrierName: po.transporter_name || '—',
      trailerNo: po.vehicle_number || '—',
      sealNo: '—',
      scac: '—',
      proNumber: po.po_number,
      containerNo: '—',
      thirdPartyName: '',
      specialInstructions: po.notes || '',
    };

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    if (document_type === 'commercial_invoice') renderCommercialInvoice(doc, ctx);
    else if (document_type === 'packing_list') renderPackingList(doc, ctx);
    else if (document_type === 'certificate_of_origin') renderCertificateOfOrigin(doc, ctx);
    else if (document_type === 'bill_of_lading') renderBillOfLading(doc, ctx);

    const pdfBuf = doc.output('arraybuffer');
    const path = `${user.id}/${purchase_order_id}/${document_type}-${Date.now()}.pdf`;
    const { error: upErr } = await supabase.storage
      .from('export-documents')
      .upload(path, new Uint8Array(pdfBuf), { contentType: 'application/pdf', upsert: false });
    if (upErr) throw upErr;

    const { data: ins, error: insErr } = await supabase
      .from('export_documents')
      .insert({
        purchase_order_id,
        buyer_id: user.id,
        document_type,
        document_number: docNumber,
        storage_path: path,
        generated_by: user.id,
        metadata: { incoterms: ctx.incoterms, currency: ctx.currency, total: po.total_amount, pol: ctx.pol, pod: ctx.pod },
      })
      .select('id')
      .single();
    if (insErr) throw insErr;

    const { data: signed } = await supabase.storage
      .from('export-documents')
      .createSignedUrl(path, 300);

    return new Response(
      JSON.stringify({ success: true, id: ins.id, document_number: docNumber, signed_url: signed?.signedUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (err) {
    console.error('[generate-export-docs] error:', err);
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

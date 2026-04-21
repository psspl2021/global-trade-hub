/**
 * generate-export-docs
 * Server-side PDF generation for international export documents:
 * Commercial Invoice, Packing List, Certificate of Origin, Bill of Lading.
 *
 * Renders an HTML template, converts to PDF via jsPDF (lightweight),
 * uploads to `export-documents` bucket, records in `export_documents` table,
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
  packing_list: 'PACKING LIST',
  certificate_of_origin: 'CERTIFICATE OF ORIGIN',
  bill_of_lading: 'BILL OF LADING',
};

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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch PO + items
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

    // Generate PDF
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    let y = 40;

    // Header
    doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text(DOC_LABELS[document_type], W / 2, y, { align: 'center' });
    y += 8;
    doc.setLineWidth(0.5);
    doc.line(40, y, W - 40, y);
    y += 24;

    const docNumber = `${document_type.toUpperCase().slice(0, 3)}-${po.po_number}-${Date.now().toString().slice(-5)}`;

    // Meta
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text(`Document No: ${docNumber}`, 40, y);
    doc.text(`Date: ${new Date().toISOString().split('T')[0]}`, W - 40, y, { align: 'right' });
    y += 16;
    doc.text(`PO Reference: ${po.po_number}`, 40, y);
    if (po.incoterms) doc.text(`Incoterms: ${po.incoterms}`, W - 40, y, { align: 'right' });
    y += 24;

    // Vendor block
    doc.setFont('helvetica', 'bold');
    doc.text('Exporter / Seller:', 40, y); y += 14;
    doc.setFont('helvetica', 'normal');
    doc.text(po.vendor_name || '—', 40, y); y += 12;
    if (po.vendor_address) {
      const addrLines = doc.splitTextToSize(po.vendor_address, 240);
      doc.text(addrLines, 40, y); y += addrLines.length * 12;
    }
    if (po.vendor_tax_id) { doc.text(`Tax ID: ${po.vendor_tax_id}`, 40, y); y += 12; }
    y += 8;

    // Consignee
    doc.setFont('helvetica', 'bold');
    doc.text('Consignee / Buyer:', 40, y); y += 14;
    doc.setFont('helvetica', 'normal');
    if (po.delivery_address) {
      const dLines = doc.splitTextToSize(po.delivery_address, 240);
      doc.text(dLines, 40, y); y += dLines.length * 12;
    }
    y += 12;

    // Items table
    doc.setFont('helvetica', 'bold');
    doc.text('Description', 40, y);
    doc.text('HS Code', 240, y);
    doc.text('Qty', 320, y);
    doc.text('Unit Price', 380, y);
    doc.text('Total', W - 80, y, { align: 'right' });
    y += 6; doc.line(40, y, W - 40, y); y += 14;

    doc.setFont('helvetica', 'normal');
    let subtotal = 0;
    (poItems || []).forEach((it: any) => {
      if (y > 720) { doc.addPage(); y = 40; }
      const desc = doc.splitTextToSize(it.description || '', 180);
      doc.text(desc, 40, y);
      doc.text(String(it.hsn_code || '—'), 240, y);
      doc.text(String(it.quantity || ''), 320, y);
      doc.text(`${po.currency || 'INR'} ${Number(it.unit_price || 0).toFixed(2)}`, 380, y);
      doc.text(`${po.currency || 'INR'} ${Number(it.total || 0).toFixed(2)}`, W - 40, y, { align: 'right' });
      subtotal += Number(it.total || 0);
      y += Math.max(14, desc.length * 12);
    });

    y += 8; doc.line(40, y, W - 40, y); y += 16;
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL', 380, y);
    doc.text(`${po.currency || 'INR'} ${Number(po.total_amount || subtotal).toFixed(2)}`, W - 40, y, { align: 'right' });
    y += 14;

    if (po.po_value_base_currency && po.base_currency && po.currency !== po.base_currency) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      doc.text(
        `Equivalent: ${po.base_currency} ${Number(po.po_value_base_currency).toFixed(2)} (FX locked at PO time)`,
        W - 40, y, { align: 'right' }
      );
      y += 16;
    }

    // Document-specific footer
    y += 24; doc.setFontSize(9); doc.setFont('helvetica', 'italic');
    if (document_type === 'certificate_of_origin') {
      doc.text('We hereby certify that the goods described above originate from the country stated.', 40, y); y += 24;
    } else if (document_type === 'bill_of_lading') {
      doc.text('Carrier acknowledges receipt of goods in apparent good order and condition.', 40, y); y += 24;
    } else if (document_type === 'packing_list') {
      doc.text('Packing dimensions and gross/net weight to be confirmed at consignment dispatch.', 40, y); y += 24;
    }

    // Signature
    y = Math.max(y, 740);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.text('Authorized Signature', 40, y);
    doc.line(40, y - 4, 200, y - 4);
    doc.text('Date & Stamp', W - 200, y);
    doc.line(W - 200, y - 4, W - 40, y - 4);

    // Upload PDF
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
        metadata: { incoterms: po.incoterms, currency: po.currency, total: po.total_amount },
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
// Must match a "Sender" configured in Brevo (domain authentication alone may not be enough)
const BREVO_SENDER_EMAIL = Deno.env.get("BREVO_SENDER_EMAIL") ?? "noreply@procuresaathi.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvoiceEmailRequest {
  to: string;
  subject: string;
  invoiceNumber: string;
  buyerName: string;
  amount: string;
  dueDate?: string;
  companyName: string;
  documentType: string;
  customMessage?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      to, 
      subject, 
      invoiceNumber, 
      buyerName, 
      amount, 
      dueDate, 
      companyName, 
      documentType,
      customMessage 
    }: InvoiceEmailRequest = await req.json();

    if (!to || !invoiceNumber || !companyName) {
      throw new Error("Missing required fields: to, invoiceNumber, companyName");
    }

    const documentTypeLabel = documentType === 'proforma_invoice' ? 'Proforma Invoice' : 
                              documentType === 'tax_invoice' ? 'Tax Invoice' :
                              documentType === 'debit_note' ? 'Debit Note' :
                              documentType === 'credit_note' ? 'Credit Note' : 'Invoice';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${documentTypeLabel} from ${companyName}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
          .invoice-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .detail-row:last-child { border-bottom: none; }
          .amount { font-size: 24px; font-weight: bold; color: #667eea; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #666; }
          .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; margin: 20px 0; }
          .custom-message { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${companyName}</h1>
          <p>${documentTypeLabel}</p>
        </div>
        <div class="content">
          <p>Dear ${buyerName},</p>
          <p>Please find attached your ${documentTypeLabel.toLowerCase()} details below:</p>
          
          <div class="invoice-details">
            <div class="detail-row">
              <span><strong>${documentTypeLabel} Number:</strong></span>
              <span>${invoiceNumber}</span>
            </div>
            <div class="detail-row">
              <span><strong>Amount:</strong></span>
              <span class="amount">${amount}</span>
            </div>
            ${dueDate ? `
            <div class="detail-row">
              <span><strong>Due Date:</strong></span>
              <span>${dueDate}</span>
            </div>
            ` : ''}
          </div>
          
          ${customMessage ? `
          <div class="custom-message">
            <strong>Note from sender:</strong><br>
            ${customMessage}
          </div>
          ` : ''}
          
          <p>If you have any questions regarding this ${documentTypeLabel.toLowerCase()}, please don't hesitate to contact us.</p>
          
          <p>Thank you for your business!</p>
          
          <p>Best regards,<br><strong>${companyName}</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated email sent via ProcureSaathi CRM</p>
          <p>© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    console.log(`Sending invoice email to ${to} for ${invoiceNumber}`);

    const emailResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY || "",
      },
      body: JSON.stringify({
        sender: { name: companyName, email: BREVO_SENDER_EMAIL },
        to: [{ email: to }],
        subject: subject || `${documentTypeLabel} ${invoiceNumber} from ${companyName}`,
        htmlContent: emailHtml,
      }),
    });

    console.log(`Brevo response status: ${emailResponse.status}`);

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Brevo API error:", errorText);
      throw new Error(`Brevo API error: ${errorText}`);
    }

    const result = await emailResponse.json();

    console.log("Invoice email sent successfully:", result);

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-invoice-email function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

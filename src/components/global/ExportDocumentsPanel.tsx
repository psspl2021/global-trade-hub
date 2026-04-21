/**
 * ExportDocumentsPanel — generate & manage export documentation pack
 * (Commercial Invoice, Packing List, Certificate of Origin, Bill of Lading).
 * Calls generate-export-docs edge function for server-side PDF rendering.
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Download, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useGlobalBuyerContext } from '@/hooks/useGlobalBuyerContext';
import { formatInTz } from '@/lib/timezone';

export const EXPORT_DOC_TYPES = [
  { value: 'commercial_invoice', label: 'Commercial Invoice' },
  { value: 'packing_list', label: 'Packing List' },
  { value: 'certificate_of_origin', label: 'Certificate of Origin' },
  { value: 'bill_of_lading', label: 'Bill of Lading' },
];

interface ExportDoc {
  id: string;
  document_type: string;
  document_number: string | null;
  storage_path: string;
  generated_at: string;
}

interface Props {
  purchaseOrderId: string;
}

export function ExportDocumentsPanel({ purchaseOrderId }: Props) {
  const { orgTimezone } = useGlobalBuyerContext();
  const [docs, setDocs] = useState<ExportDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('export_documents')
      .select('id, document_type, document_number, storage_path, generated_at')
      .eq('purchase_order_id', purchaseOrderId)
      .order('generated_at', { ascending: false });
    setDocs(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [purchaseOrderId]);

  const generate = async (docType: string) => {
    setGenerating(docType);
    try {
      const { data, error } = await supabase.functions.invoke('generate-export-docs', {
        body: { purchase_order_id: purchaseOrderId, document_type: docType },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Generation failed');
      toast.success(`${docType.replace(/_/g, ' ')} generated`);
      await load();
    } catch (e: any) {
      toast.error(e.message || 'Generation failed');
    } finally {
      setGenerating(null);
    }
  };

  const downloadDoc = async (doc: ExportDoc) => {
    const { data, error } = await supabase.storage
      .from('export-documents')
      .createSignedUrl(doc.storage_path, 60);
    if (error || !data) return toast.error('Download link failed');
    window.open(data.signedUrl, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" /> Export Documentation Pack
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {EXPORT_DOC_TYPES.map((dt) => {
            const existing = docs.find((d) => d.document_type === dt.value);
            return (
              <Button
                key={dt.value}
                variant={existing ? 'secondary' : 'outline'}
                size="sm"
                disabled={generating === dt.value}
                onClick={() => generate(dt.value)}
                className="justify-start"
              >
                {generating === dt.value ? (
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5 mr-2" />
                )}
                {existing ? `Regenerate ${dt.label}` : dt.label}
              </Button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin" /></div>
        ) : docs.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">
            No export documents generated yet.
          </p>
        ) : (
          <div className="space-y-1.5">
            {docs.map((d) => (
              <div key={d.id} className="flex items-center justify-between p-2 border rounded-md text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium">
                    {EXPORT_DOC_TYPES.find((t) => t.value === d.document_type)?.label || d.document_type}
                  </span>
                  {d.document_number && (
                    <Badge variant="outline" className="text-xs font-mono">{d.document_number}</Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatInTz(d.generated_at, orgTimezone, { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <Button size="sm" variant="ghost" onClick={() => downloadDoc(d)}>
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

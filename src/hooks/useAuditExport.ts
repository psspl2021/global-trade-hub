import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useAuditExport() {
  const [loading, setLoading] = useState(false);

  const exportAudit = async (signalId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('export_lane_audit', {
        p_signal_id: signalId
      });
      if (error) throw error;
      return data;
    } finally {
      setLoading(false);
    }
  };

  const downloadJSON = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCSV = (rows: Record<string, any>[], filename: string) => {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return { exportAudit, downloadJSON, downloadCSV, loading };
}

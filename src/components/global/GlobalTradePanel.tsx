/**
 * GlobalTradePanel — read-only display of international trade fields
 * (Incoterms, HS code, ports, shipment mode) for buyer + supplier views.
 * Auto-hides when no global fields are populated.
 */
import { Badge } from '@/components/ui/badge';
import { Globe2, Anchor, FileCode, Ship } from 'lucide-react';

interface Props {
  incoterm?: string | null;
  hs_code?: string | null;
  port_of_loading?: string | null;
  port_of_discharge?: string | null;
  origin_country?: string | null;
  destination_country?: string | null;
  shipment_mode?: string | null;
}

export function GlobalTradePanel(p: Props) {
  const hasAny = p.incoterm || p.hs_code || p.port_of_loading || p.port_of_discharge || p.origin_country || p.destination_country || p.shipment_mode;
  if (!hasAny) return null;

  const Item = ({ icon: Icon, label, value }: { icon: any; label: string; value?: string | null }) =>
    value ? (
      <div className="flex items-start gap-2 min-w-0">
        <Icon className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{label}</p>
          <p className="text-xs font-semibold truncate">{value}</p>
        </div>
      </div>
    ) : null;

  return (
    <div className="mt-3 rounded-md border border-border bg-muted/30 p-3">
      <div className="flex items-center gap-2 mb-2.5">
        <Globe2 className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-wide">Global Trade</span>
        <Badge variant="outline" className="text-[10px]">International</Badge>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <Item icon={FileCode} label="Incoterm" value={p.incoterm} />
        <Item icon={FileCode} label="HS Code" value={p.hs_code} />
        <Item icon={Anchor} label="Port of Loading" value={p.port_of_loading} />
        <Item icon={Anchor} label="Port of Discharge" value={p.port_of_discharge} />
        <Item icon={Ship} label="Shipment Mode" value={p.shipment_mode} />
        <Item icon={Globe2} label="Origin" value={p.origin_country} />
        <Item icon={Globe2} label="Destination" value={p.destination_country} />
      </div>
    </div>
  );
}

export default GlobalTradePanel;

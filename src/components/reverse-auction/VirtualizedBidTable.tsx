import { useRef, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Input } from '@/components/ui/input';

interface AuctionItem {
  id: string;
  product_name: string;
  quantity: number;
  unit: string;
  unit_price: number | null;
  description: string | null;
}

interface VirtualizedBidTableProps {
  items: AuctionItem[];
  bidPrices: Record<string, string>;
  setBidPrices: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  isLive: boolean;
}

const ROW_HEIGHT = 64;
const MAX_VISIBLE_ROWS = 12;
const VIRTUALIZATION_THRESHOLD = 15;

const BidRow = memo(function BidRow({
  item,
  unitPrice,
  lineTotal,
  onChange,
  isLive,
  value,
}: {
  item: AuctionItem;
  unitPrice: number;
  lineTotal: number;
  onChange: (val: string) => void;
  isLive: boolean;
  value: string;
}) {
  return (
    <div className="flex items-center border-b last:border-b-0 hover:bg-muted/20 transition-colors" style={{ height: ROW_HEIGHT }}>
      <div className="flex-1 px-4 py-2 min-w-0">
        <p className="font-medium text-foreground truncate">{item.product_name}</p>
        {item.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
        )}
      </div>
      <div className="w-24 px-4 py-2 text-right font-medium tabular-nums shrink-0">
        {item.quantity.toLocaleString('en-IN')}
      </div>
      <div className="w-20 px-4 py-2 text-center text-muted-foreground shrink-0">
        {item.unit}
      </div>
      <div className="w-36 px-4 py-2 text-right shrink-0">
        <Input
          type="number"
          inputSize="sm"
          placeholder={item.unit_price ? String(item.unit_price) : '0'}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="text-sm text-right w-full max-w-[120px] ml-auto tabular-nums font-semibold border-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          min="0"
          step="0.01"
          disabled={!isLive}
        />
      </div>
      <div className={`w-36 px-4 py-2 text-right font-medium tabular-nums shrink-0 ${unitPrice > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
        {unitPrice > 0 ? `₹${lineTotal.toLocaleString('en-IN')}` : '—'}
      </div>
    </div>
  );
});

export function VirtualizedBidTable({ items, bidPrices, setBidPrices, isLive }: VirtualizedBidTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const useVirtual = items.length > VIRTUALIZATION_THRESHOLD;

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
    enabled: useVirtual,
  });

  const handlePriceChange = (itemId: string, value: string) => {
    setBidPrices(prev => ({ ...prev, [itemId]: value }));
  };

  const tableHeight = useVirtual
    ? Math.min(items.length, MAX_VISIBLE_ROWS) * ROW_HEIGHT
    : undefined;

  return (
    <div className="rounded-lg border overflow-x-auto">
      <div className="min-w-[540px]">
        {/* Header */}
        <div className="flex bg-muted/50 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <div className="flex-1 px-4 py-2.5">Item</div>
          <div className="w-24 px-4 py-2.5 text-right">Qty</div>
          <div className="w-20 px-4 py-2.5 text-center">Unit</div>
          <div className="w-36 px-4 py-2.5 text-right">Unit Price (₹)</div>
          <div className="w-36 px-4 py-2.5 text-right">Line Total</div>
        </div>

        {/* Body */}
        <div
          ref={parentRef}
          style={tableHeight ? { height: tableHeight, overflow: 'auto' } : undefined}
        >
          {useVirtual ? (
            <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
              {rowVirtualizer.getVirtualItems().map(virtualRow => {
                const item = items[virtualRow.index];
                const unitPrice = Number(bidPrices[item.id] || 0);
                return (
                  <div
                    key={item.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <BidRow
                      item={item}
                      unitPrice={unitPrice}
                      lineTotal={unitPrice * item.quantity}
                      onChange={(val) => handlePriceChange(item.id, val)}
                      isLive={isLive}
                      value={bidPrices[item.id] || ''}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            items.map(item => {
              const unitPrice = Number(bidPrices[item.id] || 0);
              return (
                <BidRow
                  key={item.id}
                  item={item}
                  unitPrice={unitPrice}
                  lineTotal={unitPrice * item.quantity}
                  onChange={(val) => handlePriceChange(item.id, val)}
                  isLive={isLive}
                  value={bidPrices[item.id] || ''}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

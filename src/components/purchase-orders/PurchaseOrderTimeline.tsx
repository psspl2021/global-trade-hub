import { Check, Circle, Truck, Package, CreditCard, Lock, Send, HandshakeIcon, XCircle } from 'lucide-react';
import {
  PO_STATUS_FLOW,
  PO_STATUS_LABELS,
  PO_STATUS_COLORS,
  getStatusIndex,
  type POExecutionStatus,
} from '@/lib/po-execution-engine';
import { cn } from '@/lib/utils';

const STATUS_ICONS: Record<POExecutionStatus, React.ElementType> = {
  draft: Circle,
  sent: Send,
  accepted: HandshakeIcon,
  in_transit: Truck,
  delivered: Package,
  payment_done: CreditCard,
  closed: Lock,
  cancelled: XCircle,
};

interface PurchaseOrderTimelineProps {
  currentStatus: POExecutionStatus;
}

export function PurchaseOrderTimeline({ currentStatus }: PurchaseOrderTimelineProps) {
  const currentIndex = getStatusIndex(currentStatus);

  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2">
      {PO_STATUS_FLOW.map((status, index) => {
        const Icon = STATUS_ICONS[status];
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const colors = PO_STATUS_COLORS[status];

        return (
          <div key={status} className="flex items-center">
            <div className="flex flex-col items-center gap-1 min-w-[64px]">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all',
                  isCompleted && 'bg-primary border-primary text-primary-foreground',
                  isCurrent && `${colors.bg} ${colors.border} ${colors.text} border-2 ring-2 ring-offset-1 ring-primary/20`,
                  !isCompleted && !isCurrent && 'bg-muted/30 border-muted-foreground/20 text-muted-foreground/40'
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
              </div>
              <span
                className={cn(
                  'text-[10px] text-center leading-tight font-medium',
                  isCompleted && 'text-primary',
                  isCurrent && colors.text,
                  !isCompleted && !isCurrent && 'text-muted-foreground/40'
                )}
              >
                {PO_STATUS_LABELS[status]}
              </span>
            </div>
            {index < PO_STATUS_FLOW.length - 1 && (
              <div
                className={cn(
                  'w-4 h-0.5 mt-[-16px]',
                  index < currentIndex ? 'bg-primary' : 'bg-muted-foreground/20'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

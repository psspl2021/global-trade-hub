import { AlertTriangle, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DemoBannerProps {
  onReset: () => void;
  onExit: () => void;
}

export function DemoBanner({ onReset, onExit }: DemoBannerProps) {
  return (
    <div className="bg-amber-100 dark:bg-amber-900/30 border-b border-amber-300 dark:border-amber-700 px-4 py-2 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
        <AlertTriangle className="w-4 h-4" />
        <span className="text-sm font-semibold">Demo Mode — Simulated Data</span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onReset} className="h-7 gap-1 text-amber-800 dark:text-amber-200">
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </Button>
        <Button variant="ghost" size="sm" onClick={onExit} className="h-7 gap-1 text-amber-800 dark:text-amber-200">
          <X className="w-3.5 h-3.5" />
          Exit Demo
        </Button>
      </div>
    </div>
  );
}

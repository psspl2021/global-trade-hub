import { FileText, Sparkles, ShieldCheck, Columns3, Users } from "lucide-react";

/**
 * HeroVisual — premium 3D-style stacked tiles for the hero right column.
 * Mechanism-based proof (no numbers, no pseudo-live signals).
 * Communicates: process reliability, supplier quality, decision clarity.
 */
export const HeroVisual = () => {
  return (
    <div className="relative w-full aspect-square max-w-[560px] mx-auto select-none" aria-hidden>
      {/* Ambient glow behind tiles */}
      <div
        className="absolute inset-0 rounded-full blur-3xl opacity-60"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, hsl(var(--gold) / 0.25) 0%, hsl(var(--primary) / 0.18) 35%, transparent 70%)',
        }}
      />

      {/* Tile 1: Live RFQ (top-left, large) */}
      <div
        className="absolute top-[6%] left-[4%] w-[58%] rounded-2xl p-5 backdrop-blur-xl border border-white/10 shadow-2xl animate-float-slow"
        style={{
          background:
            'linear-gradient(140deg, hsl(222 60% 18% / 0.92) 0%, hsl(222 70% 10% / 0.88) 100%)',
          boxShadow:
            '0 30px 60px -20px hsl(222 80% 4% / 0.6), 0 0 0 1px hsl(38 88% 52% / 0.08) inset',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gold">
            <FileText className="h-3 w-3" />
            Live RFQ
          </span>
        </div>
        <div className="text-white/95 text-[13px] font-semibold mb-1">TMT Bars Fe 500D</div>
        <div className="text-white/50 text-[10.5px] mb-4">Multiple suppliers invited</div>
        <div className="space-y-1.5">
          {[
            { label: 'Requirement posted', done: true },
            { label: 'Suppliers invited', done: true },
            { label: 'Quotes received in one place', done: false },
          ].map((step) => (
            <div
              key={step.label}
              className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[10.5px] bg-white/[0.03] border border-white/5"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  step.done ? 'bg-gold' : 'bg-white/30'
                }`}
              />
              <span className="text-white/80 font-medium">{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tile 2: AI Matching (top-right) */}
      <div
        className="absolute top-[2%] right-[3%] w-[36%] rounded-2xl p-4 backdrop-blur-xl border border-white/10 shadow-2xl animate-float-medium"
        style={{
          background:
            'linear-gradient(140deg, hsl(38 88% 52% / 0.95) 0%, hsl(32 92% 45% / 0.92) 100%)',
          boxShadow: '0 30px 60px -20px hsl(32 80% 20% / 0.5)',
        }}
      >
        <Sparkles className="h-4 w-4 text-white/95 mb-2" strokeWidth={2.5} />
        <div className="text-white text-[10px] font-semibold uppercase tracking-wider opacity-85">
          AI Matching
        </div>
        <div className="text-white text-[13px] font-bold leading-tight mt-1.5">
          Requirement routed to relevant suppliers
        </div>
      </div>

      {/* Tile 3: Verified Network (middle-right) */}
      <div
        className="absolute top-[42%] right-[2%] w-[42%] rounded-2xl p-4 backdrop-blur-xl border border-white/10 shadow-2xl animate-float-fast"
        style={{
          background:
            'linear-gradient(140deg, hsl(0 0% 100% / 0.96) 0%, hsl(220 20% 96% / 0.94) 100%)',
          boxShadow: '0 30px 60px -20px hsl(222 50% 10% / 0.4)',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/70">
            Verified Network
          </span>
        </div>
        <div className="text-foreground text-[12px] font-semibold leading-tight">
          Pre-screened industrial suppliers
        </div>
        <div className="flex -space-x-1.5 mt-2.5">
          {['A', 'B', 'C', 'D'].map((l, i) => (
            <div
              key={l}
              className="h-6 w-6 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white"
              style={{
                background: ['hsl(222 65% 35%)', 'hsl(38 88% 52%)', 'hsl(180 50% 35%)', 'hsl(0 60% 50%)'][i],
              }}
            >
              {l}
            </div>
          ))}
          <div className="h-6 w-6 rounded-full border-2 border-white bg-foreground/80 flex items-center justify-center text-[8.5px] font-bold text-white">
            +
          </div>
        </div>
      </div>

      {/* Tile 4: Transparent Comparison (bottom-left) */}
      <div
        className="absolute bottom-[6%] left-[10%] w-[44%] rounded-2xl p-4 backdrop-blur-xl border border-white/10 shadow-2xl animate-float-medium"
        style={{
          background:
            'linear-gradient(140deg, hsl(222 65% 22% / 0.95) 0%, hsl(222 75% 14% / 0.92) 100%)',
          boxShadow:
            '0 30px 60px -20px hsl(222 80% 4% / 0.6), 0 0 0 1px hsl(220 100% 70% / 0.1) inset',
          animationDelay: '0.6s',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Columns3 className="h-3.5 w-3.5 text-gold" strokeWidth={2.5} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">
            Transparent Comparison
          </span>
        </div>
        <div className="text-white text-[12px] font-semibold leading-tight mb-2.5">
          Side-by-side quote evaluation
        </div>
        <div className="grid grid-cols-3 gap-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-md bg-white/[0.04] border border-white/10 p-1.5"
            >
              <div className="h-1 w-full rounded-full bg-white/20 mb-1" />
              <div className="h-1 w-2/3 rounded-full bg-gold/60" />
            </div>
          ))}
        </div>
      </div>

      {/* Floating mini chip: bottom-right */}
      <div
        className="absolute bottom-[14%] right-[8%] rounded-xl px-3 py-2 backdrop-blur-xl border border-white/10 shadow-xl animate-float-slow"
        style={{
          background: 'hsl(222 70% 12% / 0.92)',
          animationDelay: '1.2s',
        }}
      >
        <div className="flex items-center gap-2">
          <Users className="h-3 w-3 text-gold" />
          <span className="text-white/90 text-[10.5px] font-semibold">Sealed bidding</span>
        </div>
      </div>
    </div>
  );
};

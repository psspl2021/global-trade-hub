import { TrendingDown, Gavel, ShieldCheck, Zap, Users } from "lucide-react";

/**
 * HeroVisual — premium 3D-style stacked tiles for the hero right column.
 * Cinematic, layered, with subtle float animations. Pure CSS/SVG, no images.
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

      {/* Tile: Live Auction (top-left, large) */}
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
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-gold opacity-75 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold" />
            </span>
            Live Auction
          </span>
          <Gavel className="h-3.5 w-3.5 text-white/40" />
        </div>
        <div className="text-white/95 text-[13px] font-semibold mb-1">TMT Bars Fe 500D</div>
        <div className="text-white/50 text-[10.5px] mb-4">6 suppliers competing</div>
        <div className="space-y-1.5">
          {[
            { name: 'Supplier A', drop: '-3.2%', highlight: true },
            { name: 'Supplier B', drop: '-2.1%', highlight: false },
            { name: 'Supplier C', drop: '-1.8%', highlight: false },
          ].map((b) => (
            <div
              key={b.name}
              className={`flex items-center justify-between rounded-md px-2.5 py-1.5 text-[10.5px] ${
                b.highlight
                  ? 'bg-gold/15 border border-gold/30'
                  : 'bg-white/[0.03] border border-white/5'
              }`}
            >
              <span className="text-white/80 font-medium">{b.name}</span>
              <span className={`font-bold tabular-nums ${b.highlight ? 'text-gold' : 'text-emerald-400/80'}`}>
                {b.drop}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tile: Savings (top-right, small) */}
      <div
        className="absolute top-[2%] right-[3%] w-[36%] rounded-2xl p-4 backdrop-blur-xl border border-white/10 shadow-2xl animate-float-medium"
        style={{
          background:
            'linear-gradient(140deg, hsl(38 88% 52% / 0.95) 0%, hsl(32 92% 45% / 0.92) 100%)',
          boxShadow: '0 30px 60px -20px hsl(32 80% 20% / 0.5)',
        }}
      >
        <TrendingDown className="h-4 w-4 text-white/90 mb-2" strokeWidth={2.5} />
        <div className="text-white text-[10px] font-semibold uppercase tracking-wider opacity-85">
          Avg. Saving
        </div>
        <div className="text-white text-2xl font-extrabold leading-none mt-1 tabular-nums">
          5–15%
        </div>
        <div className="text-white/80 text-[9.5px] mt-1.5">Per competitive RFQ</div>
      </div>

      {/* Tile: Verified suppliers (middle-right) */}
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
            Verified
          </span>
        </div>
        <div className="text-foreground text-[12px] font-semibold leading-tight">
          Pan-India network
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

      {/* Tile: AI brain (bottom-left) */}
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
          <Zap className="h-3.5 w-3.5 text-gold" fill="currentColor" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">
            AI Sourcing
          </span>
        </div>
        <div className="text-white text-[12px] font-semibold leading-tight mb-2">
          Bids in minutes
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full bg-gradient-to-r from-gold to-primary-glow opacity-70"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
        <div className="text-white/50 text-[9.5px] mt-2">5 suppliers notified instantly</div>
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

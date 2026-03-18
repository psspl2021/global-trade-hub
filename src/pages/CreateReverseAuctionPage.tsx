import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Gavel, RotateCcw, ArrowLeft } from "lucide-react";
import { CreateReverseAuctionForm } from "@/components/reverse-auction/CreateReverseAuctionForm";

export default function CreateReverseAuctionPage() {
  const navigate = useNavigate();
  const [refresh, setRefresh] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const handleDraftSaved = useCallback(() => {
    setLastSaved(new Date());
  }, []);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/buyer");
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-background border-b">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-3">
          {/* Left: Back + Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border hover:bg-muted transition text-sm font-medium text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-foreground leading-tight">
                Create Reverse Auction
              </h1>
              <p className="text-xs text-muted-foreground">
                Add products, invite suppliers, and start bidding
                {lastSaved && (
                  <span className="ml-2 text-emerald-600 dark:text-emerald-400">
                    · Draft saved {lastSaved.toLocaleTimeString()}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Right: Clear Draft */}
          <button
            onClick={() => {
              localStorage.removeItem("auction_draft");
              setLastSaved(null);
              setRefresh((p) => p + 1);
            }}
            className="flex items-center gap-1 text-xs text-destructive hover:underline"
          >
            <RotateCcw className="w-3 h-3" />
            Clear Draft
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-background rounded-2xl shadow-sm border p-6">
          <CreateReverseAuctionForm
            key={refresh}
            mode="page"
            onDraftSaved={handleDraftSaved}
            onCreated={() => {
              localStorage.removeItem("auction_draft");
              setRefresh((p) => p + 1);
              navigate("/buyer");
            }}
          />
        </div>
      </div>
    </div>
  );
}

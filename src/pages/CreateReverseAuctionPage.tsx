import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Gavel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateReverseAuctionForm } from "@/components/reverse-auction/CreateReverseAuctionForm";

export default function CreateReverseAuctionPage() {
  const navigate = useNavigate();
  const [refresh, setRefresh] = useState(0);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-sm">
              <Gavel className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-foreground leading-tight">
                Create Reverse Auction
              </h1>
              <p className="text-xs text-muted-foreground">
                Add products, invite suppliers, and start bidding
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-background rounded-2xl shadow-sm border p-6">
          <CreateReverseAuctionForm
            key={refresh}
            mode="page"
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

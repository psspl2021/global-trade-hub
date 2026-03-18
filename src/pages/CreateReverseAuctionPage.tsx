import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Gavel } from "lucide-react";
import { CreateReverseAuctionForm } from "@/components/reverse-auction/CreateReverseAuctionForm";

export default function CreateReverseAuctionPage() {
  const navigate = useNavigate();
  const [refresh, setRefresh] = useState(0);

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-md">
              <Gavel className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Create Reverse Auction
            </h1>
          </div>
          <p className="text-sm text-muted-foreground ml-[52px]">
            Add products, invite suppliers, and start competitive bidding
          </p>
        </div>

        <div className="bg-background rounded-2xl shadow-sm border p-6">
          <CreateReverseAuctionForm
            key={refresh}
            mode="page"
            onCreated={() => {
              setRefresh((p) => p + 1);
              navigate("/buyer");
            }}
          />
        </div>
      </div>
    </div>
  );
}

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WhatsAppButtonProps {
  phoneNumber?: string;
  message?: string;
  className?: string;
}

export const WhatsAppButton = ({
  phoneNumber = "919876543210", // Default Indian number format
  message = "Hi! I'm interested in sourcing products from India via ProcureSaathi.",
  className,
}: WhatsAppButtonProps) => {
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={className}
          >
            <Button
              size="lg"
              className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg bg-[#25D366] hover:bg-[#128C7E] text-white p-0"
              aria-label="Chat on WhatsApp"
            >
              <MessageCircle className="h-7 w-7" />
            </Button>
          </a>
        </TooltipTrigger>
        <TooltipContent side="left" className="bg-card">
          <p>Chat with us on WhatsApp</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Share2, Copy, Mail, MessageCircle, Linkedin } from 'lucide-react';
import { toast } from 'sonner';

interface ShareAuctionMenuProps {
  auctionId: string;
  title?: string;
}

export function ShareAuctionMenu({ auctionId, title }: ShareAuctionMenuProps) {
  const url = `${window.location.origin}/dashboard?view=reverse-auction&auction=${auctionId}`;
  const message = title
    ? `You're invited to bid on "${title}" on ProcureSaathi. Submit your best price here: ${url}`
    : `You're invited to bid on a live reverse auction on ProcureSaathi. Submit your best price here: ${url}`;

  const enc = encodeURIComponent(message);
  const encUrl = encodeURIComponent(url);
  const encSubject = encodeURIComponent(title ? `Bid invitation: ${title}` : 'Bid invitation – ProcureSaathi');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Supplier invite link copied');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const open = (href: string) => window.open(href, '_blank', 'noopener,noreferrer');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1">
          <Share2 className="w-3 h-3" /> Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 bg-background z-50">
        <DropdownMenuItem onClick={() => open(`https://wa.me/?text=${enc}`)}>
          <MessageCircle className="w-4 h-4 mr-2 text-[#25D366]" /> WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => open(`mailto:?subject=${encSubject}&body=${enc}`)}>
          <Mail className="w-4 h-4 mr-2" /> Email
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => open(`https://www.linkedin.com/sharing/share-offsite/?url=${encUrl}`)}
        >
          <Linkedin className="w-4 h-4 mr-2 text-[#0A66C2]" /> LinkedIn
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCopy}>
          <Copy className="w-4 h-4 mr-2" /> Copy link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

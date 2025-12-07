import { Info } from 'lucide-react';

const AnnouncementBanner = () => {
  return (
    <div className="bg-primary text-primary-foreground py-2 px-4">
      <div className="container mx-auto flex items-center justify-center gap-2 text-center text-sm">
        <Info className="h-4 w-4 flex-shrink-0" />
        <p>
          <span className="font-semibold">Important:</span> ProcureSaathi - The future of B2B procurement. 
          Search 23+ product categories, browse live supplier stock, and get competitive sealed bids from verified partners.
        </p>
      </div>
    </div>
  );
};

export default AnnouncementBanner;

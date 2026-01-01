import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import procureSaathiLogo from "@/assets/procuresaathi-logo.png";

export const PageHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="bg-card border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <img 
            src={procureSaathiLogo} 
            alt="ProcureSaathi Logo" 
            className="h-24 sm:h-28 md:h-32 w-auto object-contain"
            width={128}
            height={128}
            loading="eager"
          />
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>About Us</Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/buyer')}>Buyer</Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/seller')}>Seller</Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/private-label')}>Private Label</Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/categories')}>Categories</Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/blogs')}>Blogs</Button>
        </nav>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
            Login
          </Button>
          <Button size="sm" onClick={() => navigate('/signup')}>Join Now</Button>
        </div>
      </div>
    </header>
  );
};

import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import procureSaathiLogo from "@/assets/procuresaathi-logo.png";

export const PageHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-card/95 backdrop-blur-md border-b border-border/50 sticky top-0 z-50 shadow-soft">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => navigate('/')}
        >
          <img 
            src={procureSaathiLogo} 
            alt="ProcureSaathi Logo" 
            className="h-14 sm:h-16 md:h-20 w-auto object-contain transition-transform group-hover:scale-105"
            width={80}
            height={80}
            loading="eager"
          />
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`font-medium transition-colors ${isActive('/') ? 'text-primary bg-primary/5' : 'hover:text-primary hover:bg-primary/5'}`}
            onClick={() => navigate('/')}
          >
            Home
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`font-medium transition-colors ${isActive('/buyer') ? 'text-primary bg-primary/5' : 'hover:text-primary hover:bg-primary/5'}`}
            onClick={() => navigate('/buyer')}
          >
            Buyer
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`font-medium transition-colors ${isActive('/seller') ? 'text-primary bg-primary/5' : 'hover:text-primary hover:bg-primary/5'}`}
            onClick={() => navigate('/seller')}
          >
            Seller
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`font-medium transition-colors ${isActive('/private-label') ? 'text-primary bg-primary/5' : 'hover:text-primary hover:bg-primary/5'}`}
            onClick={() => navigate('/private-label')}
          >
            Private Label
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`font-medium transition-colors ${isActive('/categories') ? 'text-primary bg-primary/5' : 'hover:text-primary hover:bg-primary/5'}`}
            onClick={() => navigate('/categories')}
          >
            Categories
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`font-medium transition-colors ${isActive('/blogs') ? 'text-primary bg-primary/5' : 'hover:text-primary hover:bg-primary/5'}`}
            onClick={() => navigate('/blogs')}
          >
            Blogs
          </Button>
        </nav>
        
        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="sm" className="font-medium" onClick={() => navigate('/login')}>
            Login
          </Button>
          <Button size="sm" className="font-semibold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5" onClick={() => navigate('/signup')}>
            Join Now
          </Button>
        </div>
      </div>
    </header>
  );
};

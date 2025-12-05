import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import procureSaathiLogo from '@/assets/procuresaathi-logo.jpg';

const Categories = () => {
  const navigate = useNavigate();

  const categoriesData = [
    'Agriculture Equipment & Supplies',
    'Apparel & Clothing',
    'Arts, Crafts & Gifts',
    'Auto Vehicle & Accessories',
    'Bags, Luggage & Cases',
    'Beauty & Personal Care',
    'Building & Construction',
    'Chemicals & Raw Materials',
    'Computer Hardware & Software',
    'Consumer Electronics',
    'Electrical Equipment & Supplies',
    'Electronic Components',
    'Energy & Power',
    'Environment & Recycling',
    'Fashion Accessories & Footwear',
    'Fashion Apparel & Fabrics',
    'Food & Beverages',
    'Furniture & Home Decor',
    'Gifts & Festival Products',
    'Hardware & Tools',
    'Health Care Products',
    'Home Appliances',
    'Household & Pets',
    'Industrial Supplies',
    'Jewelry & Watches',
    'Lights & Lighting',
    'Machinery & Equipment',
    'Medical & Healthcare',
    'Metals - Ferrous (Steel, Iron)',
    'Metals - Non-Ferrous (Copper, Aluminium)',
    'Mining & Minerals',
    'Mobile Electronics',
    'Mother, Kids & Toys',
    'Office & School Supplies',
    'Packaging & Printing',
    'Paper & Paper Products',
    'Pharmaceuticals & Drugs',
    'Plastic & Rubber',
    'Printing & Packaging',
    'Safety & Security',
    'School & Office Supplies',
    'Sports & Outdoor',
    'Telecommunication',
    'Textiles & Leather',
    'Tools & Hardware',
    'Toys & Games',
    'Transportation & Logistics',
  ];

  const handleCategoryClick = (category: string) => {
    navigate(`/browse?category=${encodeURIComponent(category)}`);
  };

  const scrollToSection = (id: string) => {
    if (id === 'contact') {
      navigate('/#contact');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <img 
              src={procureSaathiLogo} 
              alt="ProcureSaathi Logo" 
              className="h-20 w-auto object-contain"
              width={80}
              height={80}
              loading="eager"
            />
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Button variant="ghost" onClick={() => navigate('/')}>Home</Button>
            <Button variant="ghost" className="text-primary font-medium">Categories</Button>
            <Button variant="ghost" onClick={() => navigate('/#about')}>About Us</Button>
            <Button variant="ghost" onClick={() => navigate('/#contact')}>Contact</Button>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/login')}>
              Login
            </Button>
            <Button onClick={() => navigate('/signup')}>Join Now</Button>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative bg-gradient-to-r from-primary/90 to-primary py-16 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1920&q=80")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4">
            Together, we source, trade, and grow globally
          </h1>
          <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Explore our comprehensive product categories and connect with verified suppliers worldwide
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="text-lg px-8"
            onClick={() => navigate('/signup')}
          >
            Join Now - It's Free
          </Button>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Product Categories
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-3">
            {categoriesData.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryClick(category)}
                className="text-left text-sm text-muted-foreground hover:text-primary hover:underline transition-colors py-1 truncate"
                title={category}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to Source Products?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of buyers and suppliers on ProcureSaathi. Post your requirements and get competitive bids from verified suppliers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/signup')}>
              Create Free Account
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/')}>
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img 
                src={procureSaathiLogo} 
                alt="ProcureSaathi" 
                className="h-12 w-auto object-contain"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} ProcureSaathi. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Login</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/signup')}>Sign Up</Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Categories;

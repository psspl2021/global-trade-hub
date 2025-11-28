-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('buyer', 'supplier', 'admin');

-- Create enum for subscription tiers
CREATE TYPE public.subscription_tier AS ENUM ('free', 'premium');

-- Create enum for requirement status
CREATE TYPE public.requirement_status AS ENUM ('active', 'closed', 'awarded');

-- Create enum for bid status
CREATE TYPE public.bid_status AS ENUM ('pending', 'accepted', 'rejected');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  gstin TEXT,
  business_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Create function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create subscriptions table for suppliers
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  tier subscription_tier NOT NULL DEFAULT 'free',
  bids_used_this_month INTEGER NOT NULL DEFAULT 0,
  bids_limit INTEGER NOT NULL DEFAULT 5,
  billing_cycle_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  specifications JSONB,
  hs_code TEXT,
  price_range_min DECIMAL(12,2),
  price_range_max DECIMAL(12,2),
  moq INTEGER,
  packaging_details TEXT,
  lead_time_days INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create product_images table
CREATE TABLE public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create stock_inventory table
CREATE TABLE public.stock_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL UNIQUE,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'units',
  low_stock_threshold INTEGER NOT NULL DEFAULT 10,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create stock_updates table for history
CREATE TABLE public.stock_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  change_reason TEXT,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create requirements table
CREATE TABLE public.requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  product_category TEXT NOT NULL,
  description TEXT NOT NULL,
  specifications JSONB,
  quantity INTEGER NOT NULL,
  unit TEXT NOT NULL,
  budget_min DECIMAL(12,2),
  budget_max DECIMAL(12,2),
  delivery_location TEXT NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  quality_standards TEXT,
  certifications_required TEXT,
  payment_terms TEXT,
  status requirement_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create bids table
CREATE TABLE public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID REFERENCES public.requirements(id) ON DELETE CASCADE NOT NULL,
  supplier_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bid_amount DECIMAL(12,2) NOT NULL,
  service_fee DECIMAL(12,2) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  delivery_timeline_days INTEGER NOT NULL,
  terms_and_conditions TEXT,
  status bid_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(requirement_id, supplier_id)
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id UUID REFERENCES public.bids(id) ON DELETE SET NULL,
  buyer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  supplier_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  service_fee DECIMAL(12,2) NOT NULL,
  fee_paid BOOLEAN NOT NULL DEFAULT false,
  payment_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for subscriptions
CREATE POLICY "Suppliers can view own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Suppliers can update own subscription" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Suppliers can insert own subscription" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for products
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Suppliers can manage own products" ON public.products FOR ALL USING (auth.uid() = supplier_id);
CREATE POLICY "Admins can view all products" ON public.products FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for product_images
CREATE POLICY "Anyone can view product images" ON public.product_images FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND is_active = true)
);
CREATE POLICY "Suppliers can manage own product images" ON public.product_images FOR ALL USING (
  EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND supplier_id = auth.uid())
);

-- RLS Policies for stock_inventory
CREATE POLICY "Authenticated users can view stock" ON public.stock_inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "Suppliers can manage own stock" ON public.stock_inventory FOR ALL USING (
  EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND supplier_id = auth.uid())
);

-- RLS Policies for stock_updates
CREATE POLICY "Suppliers can view own stock updates" ON public.stock_updates FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND supplier_id = auth.uid())
);
CREATE POLICY "Suppliers can insert own stock updates" ON public.stock_updates FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND supplier_id = auth.uid())
);

-- RLS Policies for requirements
CREATE POLICY "Authenticated users can view active requirements" ON public.requirements FOR SELECT TO authenticated USING (status = 'active');
CREATE POLICY "Buyers can view own requirements" ON public.requirements FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Buyers can manage own requirements" ON public.requirements FOR ALL USING (auth.uid() = buyer_id);
CREATE POLICY "Admins can view all requirements" ON public.requirements FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for bids
CREATE POLICY "Buyers can view bids on own requirements" ON public.bids FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.requirements WHERE id = requirement_id AND buyer_id = auth.uid())
);
CREATE POLICY "Suppliers can view own bids" ON public.bids FOR SELECT USING (auth.uid() = supplier_id);
CREATE POLICY "Suppliers can create bids" ON public.bids FOR INSERT WITH CHECK (auth.uid() = supplier_id);
CREATE POLICY "Suppliers can update own bids" ON public.bids FOR UPDATE USING (auth.uid() = supplier_id AND status = 'pending');
CREATE POLICY "Buyers can update bid status" ON public.bids FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.requirements WHERE id = requirement_id AND buyer_id = auth.uid())
);

-- RLS Policies for transactions
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (
  auth.uid() = buyer_id OR auth.uid() = supplier_id
);
CREATE POLICY "System can insert transactions" ON public.transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all transactions" ON public.transactions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update transactions" ON public.transactions FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for documents
CREATE POLICY "Users can view own documents" ON public.documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own documents" ON public.documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all documents" ON public.documents FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can verify documents" ON public.documents FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_requirements_updated_at BEFORE UPDATE ON public.requirements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bids_updated_at BEFORE UPDATE ON public.bids
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, company_name, contact_person, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'contact_person', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  
  -- Insert user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'buyer'));
  
  -- If supplier, create subscription
  IF (NEW.raw_user_meta_data->>'role') = 'supplier' THEN
    INSERT INTO public.subscriptions (user_id, tier, bids_limit)
    VALUES (NEW.id, 'free', 5);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_products_supplier ON public.products(supplier_id);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_requirements_buyer ON public.requirements(buyer_id);
CREATE INDEX idx_requirements_status ON public.requirements(status);
CREATE INDEX idx_bids_requirement ON public.bids(requirement_id);
CREATE INDEX idx_bids_supplier ON public.bids(supplier_id);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
-- Create newsletter subscribers table for email marketing leads
CREATE TABLE public.newsletter_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  source TEXT DEFAULT 'footer',
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe (public insert)
CREATE POLICY "Anyone can subscribe to newsletter"
  ON public.newsletter_subscribers
  FOR INSERT
  WITH CHECK (true);

-- Admins can view all subscribers
CREATE POLICY "Admins can view all subscribers"
  ON public.newsletter_subscribers
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update subscribers
CREATE POLICY "Admins can update subscribers"
  ON public.newsletter_subscribers
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create demo requests table for sales leads
CREATE TABLE public.demo_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  contacted_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can submit demo request (public insert)
CREATE POLICY "Anyone can submit demo request"
  ON public.demo_requests
  FOR INSERT
  WITH CHECK (true);

-- Admins can view all demo requests
CREATE POLICY "Admins can view all demo requests"
  ON public.demo_requests
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update demo requests
CREATE POLICY "Admins can update demo requests"
  ON public.demo_requests
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));
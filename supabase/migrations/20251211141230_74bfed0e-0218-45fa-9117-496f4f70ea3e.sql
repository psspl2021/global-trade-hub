-- Create table for tracking SEO keywords
CREATE TABLE public.seo_keywords (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  keyword TEXT NOT NULL,
  target_url TEXT,
  current_position INTEGER,
  previous_position INTEGER,
  search_volume INTEGER,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  last_checked TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for SEO page audits
CREATE TABLE public.seo_page_audits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  page_url TEXT NOT NULL,
  title_tag TEXT,
  meta_description TEXT,
  h1_count INTEGER DEFAULT 0,
  image_alt_missing INTEGER DEFAULT 0,
  word_count INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  issues JSONB DEFAULT '[]'::jsonb,
  suggestions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for content suggestions
CREATE TABLE public.seo_content_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  keyword TEXT NOT NULL,
  suggestion_type TEXT CHECK (suggestion_type IN ('blog_topic', 'product_description', 'meta_tag', 'heading')),
  suggestion TEXT NOT NULL,
  is_used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seo_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_page_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_content_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS policies for seo_keywords
CREATE POLICY "Users can view their own keywords" ON public.seo_keywords
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own keywords" ON public.seo_keywords
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own keywords" ON public.seo_keywords
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own keywords" ON public.seo_keywords
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for seo_page_audits
CREATE POLICY "Users can view their own audits" ON public.seo_page_audits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own audits" ON public.seo_page_audits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own audits" ON public.seo_page_audits
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for seo_content_suggestions
CREATE POLICY "Users can view their own suggestions" ON public.seo_content_suggestions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own suggestions" ON public.seo_content_suggestions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own suggestions" ON public.seo_content_suggestions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own suggestions" ON public.seo_content_suggestions
  FOR DELETE USING (auth.uid() = user_id);

-- Admin can view all
CREATE POLICY "Admin can view all keywords" ON public.seo_keywords
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can view all audits" ON public.seo_page_audits
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can view all suggestions" ON public.seo_content_suggestions
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));
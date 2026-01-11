-- A) Normalize Status Values with CHECK constraints

-- ai_sales_leads status constraint
ALTER TABLE ai_sales_leads 
ADD CONSTRAINT ai_sales_lead_status_valid 
CHECK (status IN ('new', 'contacted', 'rfq_created', 'closed', 'ignored'));

-- ai_sales_discovery_jobs status constraint
ALTER TABLE ai_sales_discovery_jobs 
ADD CONSTRAINT ai_sales_discovery_job_status_valid 
CHECK (status IN ('pending', 'running', 'completed', 'failed'));

-- ai_sales_conversions conversion_type constraint
ALTER TABLE ai_sales_conversions 
ADD CONSTRAINT ai_sales_conversion_type_valid 
CHECK (conversion_type IN ('rfq_created', 'deal_closed', 'signup', 'demo_request'));

-- ai_sales_messages channel constraint
ALTER TABLE ai_sales_messages 
ADD CONSTRAINT ai_sales_message_channel_valid 
CHECK (channel IN ('email', 'whatsapp', 'linkedin'));

-- ai_sales_messages tone constraint
ALTER TABLE ai_sales_messages 
ADD CONSTRAINT ai_sales_message_tone_valid 
CHECK (tone IN ('professional', 'friendly', 'urgent', 'casual'));

-- B) Lead De-duplication Guard
CREATE UNIQUE INDEX uniq_ai_sales_lead_email_category 
ON ai_sales_leads (email, category) 
WHERE email IS NOT NULL;

-- C) Performance Indexes for admin dashboards
CREATE INDEX idx_ai_sales_conversions_rfq 
ON ai_sales_conversions(rfq_id) 
WHERE rfq_id IS NOT NULL;

CREATE INDEX idx_ai_sales_leads_discovered_at 
ON ai_sales_leads(discovered_at DESC);

CREATE INDEX idx_ai_sales_leads_confidence 
ON ai_sales_leads(confidence_score DESC) 
WHERE confidence_score IS NOT NULL;

CREATE INDEX idx_ai_sales_landing_pages_active 
ON ai_sales_landing_pages(is_active, slug) 
WHERE is_active = true;

-- Composite index for funnel analysis
CREATE INDEX idx_ai_sales_leads_funnel 
ON ai_sales_leads(status, category, country);

-- Landing page performance tracking
CREATE INDEX idx_ai_sales_landing_pages_performance 
ON ai_sales_landing_pages(view_count DESC, conversion_count DESC);
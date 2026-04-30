-- 1) Enable RLS on auction_pricing_plans (policy already exists)
ALTER TABLE public.auction_pricing_plans ENABLE ROW LEVEL SECURITY;

-- 2) Convert all public views without security_invoker to invoker mode.
-- This makes them respect the querying user's RLS instead of the postgres owner's.
ALTER VIEW public.admin_ai_sales_metrics SET (security_invoker = true);
ALTER VIEW public.admin_corridor_intelligence SET (security_invoker = true);
ALTER VIEW public.admin_daily_kpis SET (security_invoker = true);
ALTER VIEW public.admin_industry_revenue SET (security_invoker = true);
ALTER VIEW public.admin_landing_page_metrics SET (security_invoker = true);
ALTER VIEW public.admin_overview_metrics SET (security_invoker = true);
ALTER VIEW public.admin_profit_summary SET (security_invoker = true);
ALTER VIEW public.admin_revenue_trend_30d SET (security_invoker = true);
ALTER VIEW public.admin_revenue_trend_7d SET (security_invoker = true);
ALTER VIEW public.admin_seo_funnel SET (security_invoker = true);
ALTER VIEW public.buyer_ai_selections SET (security_invoker = true);
ALTER VIEW public.buyer_auction_revenue SET (security_invoker = true);
ALTER VIEW public.control_tower_executive_metrics SET (security_invoker = true);
ALTER VIEW public.demand_intelligence_dashboard SET (security_invoker = true);
ALTER VIEW public.demand_page_performance SET (security_invoker = true);
ALTER VIEW public.demand_revenue_dashboard SET (security_invoker = true);
ALTER VIEW public.nudge_impact_analytics SET (security_invoker = true);
ALTER VIEW public.seo_revenue_dashboard SET (security_invoker = true);
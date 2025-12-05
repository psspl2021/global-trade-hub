import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchResult {
  title: string;
  description: string;
  url: string;
  source: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keyword = '', category = '', country = '' } = await req.json();

    // Input validation
    const maxLength = 200;
    if (typeof keyword !== 'string' || typeof category !== 'string' || typeof country !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid input types' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (keyword.length > maxLength || category.length > maxLength || country.length > maxLength) {
      return new Response(
        JSON.stringify({ error: `Input too long (max ${maxLength} characters)` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Search request:', { keyword, category, country });
    
    // Build search query
    let query = keyword || 'B2B suppliers';
    if (category) query += ` ${category}`;
    query += ' suppliers manufacturers wholesalers';
    if (country) query += ` in ${country}`;
    
    console.log('Constructed query:', query);
    
    // Use DuckDuckGo HTML search (free, no API key)
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Search request failed: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Parse results from HTML
    const results: SearchResult[] = [];
    
    // Extract results using regex patterns
    const resultPattern = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi;
    const snippetPattern = /<a[^>]*class="result__snippet"[^>]*>([^<]*(?:<[^>]*>[^<]*)*)<\/a>/gi;
    
    let match;
    const urls: string[] = [];
    const titles: string[] = [];
    const snippets: string[] = [];
    
    // Extract URLs and titles
    while ((match = resultPattern.exec(html)) !== null) {
      const url = match[1];
      const title = match[2].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
      if (url && title && !url.includes('duckduckgo.com')) {
        urls.push(url);
        titles.push(title);
      }
    }
    
    // Extract snippets
    const snippetRegex = /<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
    while ((match = snippetRegex.exec(html)) !== null) {
      const snippet = match[1]
        .replace(/<[^>]*>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      snippets.push(snippet);
    }
    
    // Combine results
    for (let i = 0; i < Math.min(urls.length, 10); i++) {
      try {
        const urlObj = new URL(urls[i]);
        results.push({
          title: titles[i] || 'Untitled',
          description: snippets[i] || 'No description available',
          url: urls[i],
          source: urlObj.hostname.replace('www.', ''),
        });
      } catch {
        // Skip invalid URLs
      }
    }
    
    console.log(`Found ${results.length} results`);
    
    return new Response(JSON.stringify({ results, query }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error: unknown) {
    console.error('Search error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage, results: [] }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

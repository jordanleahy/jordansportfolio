import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { vendorId, websiteUrl, agentId } = await req.json()

    if (!vendorId || !websiteUrl || !agentId) {
      throw new Error('Missing required parameters: vendorId, websiteUrl, agentId')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // System prompt for website structure analysis
    const systemPrompt = `You are a Website Structure Analyzer AI. Your task is to analyze a website's structure and content organization.

When given a website URL, you should:
1. Try to discover the sitemap from robots.txt or standard locations (/sitemap.xml)
2. If no sitemap exists, analyze the main navigation structure
3. Categorize pages by business function (products, about, pricing, contact, blog, etc.)
4. Return a structured JSON tree format

Return your analysis in this exact JSON format:
{
  "discoveryMethod": "sitemap" | "navigation" | "crawl",
  "totalPages": number,
  "lastAnalyzed": "ISO timestamp",
  "structure": {
    "products": { "pages": ["url1", "url2"], "count": number },
    "about": { "pages": ["url1"], "count": number },
    "pricing": { "pages": ["url1"], "count": number },
    "contact": { "pages": ["url1"], "count": number },
    "blog": { "pages": ["url1", "url2"], "count": number },
    "support": { "pages": ["url1"], "count": number },
    "other": { "pages": ["url1"], "count": number }
  },
  "keyInsights": ["insight1", "insight2"],
  "navigationStructure": [
    {
      "title": "Products",
      "url": "/products",
      "children": [
        { "title": "Product A", "url": "/products/a" },
        { "title": "Product B", "url": "/products/b" }
      ]
    }
  ]
}`

    // Create OpenAI API request
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Analyze the website structure for: ${websiteUrl}

Please visit the website and analyze its structure. Look for sitemaps, navigation menus, and page organization. Provide insights about the website's architecture and categorize pages by their business function.`
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      })
    })

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.statusText}`)
    }

    const openaiData = await openaiResponse.json()
    const analysisContent = openaiData.choices[0].message.content

    // Parse the JSON response
    let sitemapTree
    try {
      sitemapTree = JSON.parse(analysisContent)
    } catch (e) {
      // If JSON parsing fails, create a basic structure
      sitemapTree = {
        discoveryMethod: "analysis_failed",
        totalPages: 0,
        lastAnalyzed: new Date().toISOString(),
        structure: {
          other: { pages: [websiteUrl], count: 1 }
        },
        keyInsights: ["Analysis could not be completed"],
        navigationStructure: []
      }
    }

    // Update vendor with sitemap analysis
    const { error: updateError } = await supabase
      .from('vendors')
      .update({
        sitemap_tree: sitemapTree,
        sitemap_fetched_at: new Date().toISOString(),
        sitemap_agent_id: agentId
      })
      .eq('id', vendorId)

    if (updateError) {
      throw updateError
    }

    return new Response(JSON.stringify({
      success: true,
      sitemapTree,
      message: 'Website structure analysis completed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Website analysis error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description } = await req.json();
    
    if (!description || description.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: 'Please provide a detailed description of your requirement' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service not configured");
    }

    const systemPrompt = `You are an expert B2B procurement assistant. Your job is to convert natural language sourcing requirements into structured RFQ (Request for Quotation) data.

Given a user's description of what they need to procure, extract and generate:
1. A professional title for the requirement
2. A detailed description with specifications
3. The most appropriate product category
4. Estimated quantity and unit
5. Suggested trade type (import/export/domestic)
6. Recommended quality standards
7. Any certifications that might be required
8. Standard payment terms suggestion

Categories available:
- Auto Vehicle & Accessories
- Beauty & Personal Care
- Consumer Electronics
- Electronic Components
- Fashion Accessories & Footwear
- Fashion Apparel & Fabrics
- Food & Beverages
- Furniture & Home Decor
- Gifts & Festival Products
- Hardware & Tools
- Health Care Products
- Home Appliances
- Household & Pets
- Industrial Supplies
- Machinery & Equipment
- Metals - Ferrous (Steel, Iron)
- Metals - Non-Ferrous (Copper, Aluminium)
- Mobile Electronics
- Mother, Kids & Toys
- Printing & Packaging
- School & Office Supplies
- Sports & Outdoor
- Telecommunication

Units available: Pieces, Kilograms, Tons, Liters, Meters, Sets, Cartons, Boxes

Trade types: import, export, domestic_india`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate a structured RFQ for this requirement: "${description}"` }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_rfq",
              description: "Generate a structured RFQ from user's requirement description",
              parameters: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    description: "Professional title for the requirement (5-100 chars)"
                  },
                  description: {
                    type: "string",
                    description: "Detailed description with specifications (20-1000 chars)"
                  },
                  category: {
                    type: "string",
                    description: "Product category from the available list"
                  },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        item_name: { type: "string", description: "Name of the item" },
                        description: { type: "string", description: "Item specifications" },
                        quantity: { type: "number", description: "Estimated quantity" },
                        unit: { type: "string", description: "Unit from available list" }
                      },
                      required: ["item_name", "description", "quantity", "unit"]
                    },
                    description: "List of items to procure"
                  },
                  trade_type: {
                    type: "string",
                    enum: ["import", "export", "domestic_india"],
                    description: "Type of trade"
                  },
                  quality_standards: {
                    type: "string",
                    description: "Recommended quality standards"
                  },
                  certifications_required: {
                    type: "string",
                    description: "Certifications that might be required"
                  },
                  payment_terms: {
                    type: "string",
                    description: "Suggested payment terms"
                  },
                  delivery_location: {
                    type: "string",
                    description: "Delivery location extracted from user description (City, State, Country format). Extract any mentioned location, address, city, state, or PIN code."
                  }
                },
                required: ["title", "description", "category", "items", "trade_type", "delivery_location"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_rfq" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service credits exhausted. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error("Failed to generate RFQ");
    }

    const data = await response.json();
    console.log("AI response:", JSON.stringify(data, null, 2));

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "generate_rfq") {
      throw new Error("Invalid AI response format");
    }

    const rfqData = JSON.parse(toolCall.function.arguments);
    
    return new Response(
      JSON.stringify({ rfq: rfqData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in generate-rfq function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate RFQ" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

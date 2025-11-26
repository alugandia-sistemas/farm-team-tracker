import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateTokensRequest {
  quantity: number;
  expirationDays?: number;
}

const generateRandomToken = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
    if ((i + 1) % 4 === 0 && i < 11) token += "-";
  }
  return token;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { quantity, expirationDays = 30 }: GenerateTokensRequest = await req.json();

    if (!quantity || quantity < 1 || quantity > 100) {
      return new Response(
        JSON.stringify({ error: "Quantity must be between 1 and 100" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tokens = [];
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    for (let i = 0; i < quantity; i++) {
      const token = generateRandomToken();
      tokens.push({
        token,
        expires_at: expiresAt.toISOString(),
        used: false,
      });
    }

    const { data, error } = await supabase
      .from("invitation_tokens")
      .insert(tokens)
      .select();

    if (error) {
      console.error("Error generating tokens:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generated ${quantity} tokens`);

    return new Response(
      JSON.stringify({ tokens: data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in generate-tokens function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);

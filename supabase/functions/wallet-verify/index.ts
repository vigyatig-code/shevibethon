import { createClient } from "npm:@supabase/supabase-js@2";
import { verifyMessage } from "npm:viem@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const NONCE_TTL_MS = 5 * 60 * 1000;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { address, message, signature } = await req.json();
    if (!address || !message || !signature) {
      return new Response(
        JSON.stringify({ error: "address, message, and signature are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const lowerAddress = address.toLowerCase();

    // Look up the pending nonce
    const { data: nonceRow, error: nonceError } = await supabase
      .from("wallet_nonces")
      .select("nonce, created_at")
      .eq("address", lowerAddress)
      .maybeSingle();

    if (nonceError || !nonceRow) {
      return new Response(
        JSON.stringify({ error: "No pending nonce for this address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Check TTL
    const ageMs = Date.now() - new Date(nonceRow.created_at).getTime();
    if (ageMs > NONCE_TTL_MS) {
      await supabase.from("wallet_nonces").delete().eq("address", lowerAddress);
      return new Response(
        JSON.stringify({ error: "Nonce expired" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verify the nonce is present in the signed message
    if (!message.includes(nonceRow.nonce)) {
      return new Response(
        JSON.stringify({ error: "Nonce not found in signed message" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verify the signature
    const recovered = await verifyMessage({ address, message, signature });
    if (!recovered) {
      return new Response(
        JSON.stringify({ error: "Signature verification failed" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Delete the used nonce
    await supabase.from("wallet_nonces").delete().eq("address", lowerAddress);

    const syntheticEmail = `${lowerAddress}@wallet.local`;
    const randomPassword = crypto.randomUUID() + crypto.randomUUID();

    // Find or create the auth user
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers.users.find(
      (u) => u.email === syntheticEmail,
    );

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: syntheticEmail,
        password: randomPassword,
        email_confirm: true,
      });

      if (createError || !newUser.user) {
        return new Response(
          JSON.stringify({ error: "Failed to create auth user" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      userId = newUser.user.id;
    }

    // Upsert the profile
    await supabase
      .from("profiles")
      .upsert({
        user_id: userId,
        wallet_address: lowerAddress,
        verified_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    // Generate a magic link
    const { data: link, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: syntheticEmail,
    });

    if (linkError || !link?.properties?.hashed_token) {
      return new Response(
        JSON.stringify({ error: "Failed to generate auth link" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ email: syntheticEmail, tokenHash: link.properties.hashed_token }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
